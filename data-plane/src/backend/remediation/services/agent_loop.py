"""
The ReAct loop core: given a Zabbix event_id, create an Incident, let the model
investigate with tools, apply the confidence gate, execute (or hold for approval)
a remediation, and always post a diagnostic report to Slack/Discord.

This function is invocation-agnostic — run_incident_agent.py calls it from a
ThreadPoolExecutor today; swapping to a Celery task later requires no changes here.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

from django.conf import settings
from django.utils import timezone

from monitoring.zabbix_client import get_zabbix_client
from notifications.services import send_notification

from ..models import AgentStep, Incident, RemediationAction, RemediationScriptPolicy
from . import context, guardrails
from .agent_tools import SEVERITY_LABELS, TOOL_FUNCTIONS, TOOL_SCHEMAS
from .llm_client import get_client, get_model

logger = logging.getLogger(__name__)

MAX_MESSAGES = 20

SYSTEM_PROMPT = (
    "You are NetSentinel's autonomous incident response agent. You investigate Zabbix "
    "alerts using the provided tools (problem/trigger detail, host history, linked "
    "asset context, this agent's own history of past incidents, and the host's "
    "registered remediation scripts) to form a root-cause hypothesis. Prefer the "
    "least disruptive action, and prefer an existing registered script over writing "
    "a new one. Real production hosts will not have a pre-built script for every "
    "situation — when nothing registered fits, you may author a new remediation "
    "command yourself via propose_remediation's script_command argument. Authored "
    "commands are scanned for destructive patterns and always held for human "
    "approval, no matter your confidence, so never assume one will run "
    "unsupervised — write it as if a careful human will read it before it touches "
    "anything, keep it narrowly scoped to the one host and one fix, and avoid "
    "anything destructive, irreversible, or broader than the problem at hand. Only "
    "report 'high' confidence when the evidence clearly supports both the root "
    "cause and the fix — when uncertain, use 'medium' or 'low' so a human reviews "
    "it instead of an automated action running unsupervised. Call propose_remediation "
    "exactly once, as your last action, once you have enough information to decide."
)


def run_agent_loop(event_id: str, force: bool = False) -> None:
    """
    force=True re-investigates an event even if it already has an Incident (e.g.
    the run was interrupted, or a prior escalation never got a real fix) —
    reused by run_incident_agent's --retry, which is the only caller that should
    ever pass it. Reuses the existing Incident row rather than creating a
    second one (zabbix_event_id is unique), and adds a new round of steps/action
    on top of its history instead of erasing it.
    """
    logger.info("Agent loop starting for event %s (force=%s)", event_id, force)
    try:
        client = get_zabbix_client()
    except Exception as exc:  # noqa: BLE001
        logger.error("Zabbix not reachable, cannot investigate event %s: %s", event_id, exc)
        return

    try:
        problems = client.problems.get(eventids=[event_id], output="extend")
    except Exception as exc:  # noqa: BLE001
        logger.error("Could not fetch problem %s from Zabbix: %s", event_id, exc)
        return
    if not problems:
        logger.warning("Problem %s is no longer active in Zabbix; skipping.", event_id)
        return

    problem = problems[0]
    trigger_id = problem.get("objectid")
    triggers = client.triggers.get(
        triggerids=[trigger_id] if trigger_id else [],
        output="extend",
        selectHosts=["hostid", "host", "name"],
    )
    trigger = triggers[0] if triggers else {}
    hosts = trigger.get("hosts") or []
    host_id = hosts[0].get("hostid") if hosts else str(problem.get("hostid", ""))
    host_name = hosts[0].get("name") if hosts else "unknown host"
    severity = SEVERITY_LABELS.get(str(problem.get("severity", 0)), "Unknown")

    incident, created = Incident.objects.get_or_create(
        zabbix_event_id=event_id,
        defaults={
            "zabbix_host_id": host_id,
            "host_name": host_name,
            "trigger_name": trigger.get("description", "N/A"),
            "severity": severity,
            "status": "investigating",
        },
    )
    if not created:
        if not force:
            logger.info("Event %s already has an Incident; skipping duplicate run.", event_id)
            return
        logger.info(
            "Incident %s for event %s already exists (status=%s) — force re-running.",
            incident.id, event_id, incident.status,
        )
        incident.zabbix_host_id = host_id
        incident.host_name = host_name
        incident.trigger_name = trigger.get("description", "N/A")
        incident.severity = severity
        incident.status = "investigating"
        incident.confidence = None
        incident.resolved_at = None
        # force=True is an explicit "start fresh" override — including any prior
        # human takeover, so a deliberate --retry can hand a stuck incident back
        # to the agent even after a human intervened on it.
        incident.human_intervened_at = None
        incident.human_intervened_by = None
        incident.human_intervention_note = ""
        incident.save(
            update_fields=[
                "zabbix_host_id", "host_name", "trigger_name", "severity",
                "status", "confidence", "resolved_at",
                "human_intervened_at", "human_intervened_by", "human_intervention_note",
                "updated_at",
            ]
        )
    else:
        logger.info(
            "Incident %s created for event %s (host=%s, trigger=%r, severity=%s)",
            incident.id, event_id, host_name, trigger.get("description", "N/A"), severity,
        )
    context.start_incident_context(incident)

    decision: Optional[dict] = None
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"A Zabbix alert fired.\n"
                f"Event ID: {event_id}\n"
                f"Host: {host_name} (host_id={host_id})\n"
                f"Trigger: {trigger.get('description', 'N/A')}\n"
                f"Severity: {severity}\n\n"
                "Investigate using the available tools, then call "
                "propose_remediation exactly once as your final action."
            ),
        },
    ]
    human_took_over = False
    try:
        openai_client = get_client()

        # OpenAI's Chat Completions API has no auto-executing tool runner, so this
        # loop plays that role: one round trip per iteration — call the model, run
        # whatever tools it asked for, feed the results back, repeat until it calls
        # propose_remediation or we hit MAX_MESSAGES round trips.
        for _ in range(MAX_MESSAGES):
            if _human_has_taken_over(incident):
                human_took_over = True
                break
            response = openai_client.chat.completions.create(
                model=get_model(),
                max_tokens=2000,
                messages=messages,
                tools=TOOL_SCHEMAS,
                tool_choice="auto",
            )
            assistant_message = response.choices[0].message
            tool_calls = assistant_message.tool_calls or []

            if assistant_message.content:
                context.log_step("thinking", tool_output=assistant_message.content)

            messages.append(
                {
                    "role": "assistant",
                    "content": assistant_message.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in tool_calls
                    ]
                    or None,
                }
            )

            if not tool_calls:
                # Plain text with no tool call — nudge once rather than stalling;
                # if it still won't call a tool, the round-trip cap below escalates.
                messages.append(
                    {
                        "role": "user",
                        "content": "Continue investigating with the tools available, or "
                        "call propose_remediation if you're ready to decide.",
                    }
                )
                continue

            for tool_call in tool_calls:
                tool_name = tool_call.function.name
                try:
                    tool_input = json.loads(tool_call.function.arguments or "{}")
                except json.JSONDecodeError:
                    tool_input = {}

                logger.debug(
                    "Incident %s: tool_call %s(%s)", incident.id, tool_name, tool_input
                )
                context.log_step("tool_call", tool_name=tool_name, tool_input=tool_input)

                fn = TOOL_FUNCTIONS.get(tool_name)
                try:
                    tool_result = fn(**tool_input) if fn else f"Unknown tool '{tool_name}'"
                except Exception as exc:  # noqa: BLE001 - bad/malformed args from the model
                    logger.warning(
                        "Incident %s: tool '%s' raised %s", incident.id, tool_name, exc
                    )
                    tool_result = f"Error calling tool '{tool_name}': {exc}"

                messages.append(
                    {"role": "tool", "tool_call_id": tool_call.id, "content": tool_result}
                )
                if tool_name == "propose_remediation":
                    decision = tool_input

            if decision is not None:
                break

        if human_took_over:
            logger.info(
                "Incident %s: human intervened mid-investigation; stopping.", incident.id
            )
        elif decision is None:
            logger.warning(
                "Incident %s: agent hit the %d-message limit without a decision; escalating.",
                incident.id, MAX_MESSAGES,
            )
        else:
            logger.info("Incident %s: agent decided %s", incident.id, decision)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Agent loop failed for incident %s", incident.id)
        context.log_step("final", tool_output=f"Agent loop error: {exc}")

    # Re-check rather than trusting human_took_over alone — intervention may have
    # landed during the final iteration's tool calls, after the loop's own check
    # last passed. Either way, a human owning the incident means the agent must not
    # touch it further, in particular must not execute/propose anything below.
    if human_took_over or _human_has_taken_over(incident):
        logger.info(
            "Incident %s: a human took over before the agent finished; not finalizing.",
            incident.id,
        )
        context.log_step(
            "final", tool_output="Halted: a human took over this incident before the agent finished."
        )
        return

    _finalize_incident(incident, decision)


def _human_has_taken_over(incident: Incident) -> bool:
    """Cheap DB check for cooperative cancellation: the intervene endpoint/admin
    action runs in a different thread/process than the agent loop, so this is the
    only way the loop can notice a human has taken over mid-run."""
    return Incident.objects.filter(
        pk=incident.pk, human_intervened_at__isnull=False
    ).exists()


def execute_remediation_script(host_id: str, script_name: str) -> dict:
    """Look up and execute a registered Zabbix script by name against a host."""
    logger.info("Executing registered script '%s' on host %s", script_name, host_id)
    try:
        client = get_zabbix_client()
        scripts = client.scripts.get(
            hostids=[host_id], output="extend", filter={"name": script_name}
        )
        if not scripts:
            logger.warning("Script '%s' not found for host %s", script_name, host_id)
            return {"ok": False, "error": f"Script '{script_name}' not found for host {host_id}."}
        result = client.scripts.execute(scriptid=scripts[0]["scriptid"], hostid=host_id)
        ok = bool(result.get("response"))
        logger.info("Script '%s' on host %s finished, ok=%s", script_name, host_id, ok)
        return {"ok": ok, "raw": result}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Error executing script '%s' on host %s", script_name, host_id)
        return {"ok": False, "error": str(exc)}


def execute_generated_remediation_script(action: RemediationAction) -> dict:
    """
    Register and run a script the agent authored itself (no registered Zabbix
    script matched the problem). Only reachable through the approve endpoint —
    generated scripts never auto-execute; see _finalize_incident.

    Re-runs the guardrail scan as defense-in-depth: the first scan already ran
    when the action was proposed, this catches drift between proposal and
    approval (e.g. guardrail patterns tightened in the meantime).
    """
    incident = action.incident
    command = action.generated_script_command
    violations = guardrails.check_script(command)
    if violations:
        logger.error(
            "Refusing to execute generated script for incident %s: guardrail violations %s",
            incident.id, violations,
        )
        return {"ok": False, "error": "Blocked by guardrails", "violations": violations}

    host_id = incident.zabbix_host_id
    logger.info(
        "Registering and executing agent-authored script '%s' for incident %s on host %s",
        action.zabbix_script_name, incident.id, host_id,
    )
    try:
        client = get_zabbix_client()
        hosts = client.hosts.get(hostids=[host_id], output=["hostid"], selectGroups=["groupid"])
        host_groups = [g["groupid"] for g in (hosts[0].get("groups") or [])] if hosts else []

        created = client.scripts.create(
            name=action.zabbix_script_name,
            command=command,
            execute_on=0,  # Zabbix agent — runs directly on the target host, not the Zabbix server
            host_groups=host_groups,
            description=(
                f"Agent-authored for incident {incident.id} ({incident.trigger_name}): "
                f"{action.reasoning[:300]}"
            ),
        )
        scriptid = created["scriptids"][0]
        result = client.scripts.execute(scriptid=scriptid, hostid=host_id)
        ok = bool(result.get("response"))
        logger.info(
            "Agent-authored script '%s' (scriptid=%s) on host %s finished, ok=%s",
            action.zabbix_script_name, scriptid, host_id, ok,
        )

        RemediationScriptPolicy.objects.get_or_create(
            zabbix_script_name=action.zabbix_script_name,
            defaults={
                "risk_level": "high",
                "auto_execute_allowed": False,
                "description": (
                    "Authored by the incident agent — review before enabling "
                    "auto-execution for future incidents."
                ),
            },
        )
        return {"ok": ok, "raw": result, "scriptid": scriptid}
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Error registering/executing generated script for incident %s", incident.id
        )
        return {"ok": False, "error": str(exc)}


def _lookup_and_scan_registered_script(host_id: str, script_name: str) -> tuple[Optional[str], list]:
    """
    For a script the agent picked from list_remediation_scripts that has no
    RemediationScriptPolicy yet: pull its actual command text from Zabbix and
    run it through the same static guardrail scan agent-authored scripts get
    (see guardrails.check_script). Lets a never-before-seen but genuinely
    low-risk script (e.g. a plain service restart) get classified and
    auto-execute on first use instead of always blocking on a human
    pre-registering every script by hand — see _finalize_incident.

    Returns (command_text_or_None, violations) — a None command means the
    script couldn't be found/fetched, in which case violations explains why
    and the caller must not auto-execute.
    """
    try:
        client = get_zabbix_client()
        scripts = client.scripts.get(
            hostids=[host_id], output="extend", filter={"name": script_name}
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Could not fetch script '%s' from Zabbix for risk scan: %s", script_name, exc
        )
        return None, [f"could not fetch script from Zabbix: {exc}"]

    if not scripts:
        return None, [f"script '{script_name}' not found in Zabbix for host {host_id}"]

    command = scripts[0].get("command", "")
    return command, guardrails.check_script(command)


class ApprovalError(Exception):
    """Raised by approve_and_execute when an action isn't eligible to run right now."""

    def __init__(self, detail: str, violations: Optional[list] = None) -> None:
        super().__init__(detail)
        self.detail = detail
        self.violations = violations


def approve_and_execute(action: RemediationAction, user) -> RemediationAction:
    """
    The one place "approve a remediation action" actually happens — shared by the
    DRF endpoint (views.RemediationActionViewSet.approve) and the Django admin
    approve button (admin.RemediationActionAdmin), so the two surfaces can't drift
    out of sync with each other. Raises ApprovalError (never returns an error
    value) so both callers can turn it into whatever response shape they need.
    """
    if action.status != "awaiting_approval":
        raise ApprovalError(f"Action is '{action.status}', not awaiting approval.")
    if action.script_source == "generated" and action.guardrail_violations:
        # Shouldn't normally reach awaiting_approval with violations present, but
        # refuse defensively rather than trust an approver clicking through.
        raise ApprovalError("Blocked by guardrails.", violations=action.guardrail_violations)
    if action.incident.human_intervened_at:
        # A human already took ownership of the incident (possibly a different
        # person, or a stale browser tab) — that supersedes an agent-proposed
        # action rather than stacking with it.
        raise ApprovalError("A human has already taken over this incident.")

    incident = action.incident
    logger.info(
        "User %s approving action %s (%s) for incident %s",
        user, action.id, action.zabbix_script_name, incident.id,
    )
    if action.script_source == "generated":
        result = execute_generated_remediation_script(action)
    else:
        result = execute_remediation_script(incident.zabbix_host_id, action.zabbix_script_name)

    action.status = "executed" if result.get("ok") else "failed"
    action.execution_result = result
    action.approved_by = user
    action.executed_at = timezone.now()
    action.save(update_fields=["status", "execution_result", "approved_by", "executed_at"])

    incident.status = "remediated" if result.get("ok") else "escalated"
    incident.save(update_fields=["status", "updated_at"])

    return action


class InterventionError(Exception):
    """Raised by intervene() when the incident isn't eligible for takeover."""

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


def intervene(incident: Incident, user, note: str = "") -> Incident:
    """
    Human takeover: shared by the DRF endpoint (views.IncidentViewSet.intervene)
    and the Django admin action, same reasoning as approve_and_execute above.

    Marks the incident so run_agent_loop notices and stops (see
    _human_has_taken_over) if it's currently mid-run, and so run_incident_agent's
    poller never dispatches or retries it again (Incident.TERMINAL_STATUSES).
    Any remediation actions still sitting proposed/awaiting approval are
    superseded — the human is handling this now, not approving the agent's plan.
    """
    if incident.status in Incident.TERMINAL_STATUSES:
        raise InterventionError(
            f"Incident is already '{incident.status}'; nothing to take over."
        )

    logger.info("User %s taking over incident %s", user, incident.id)
    incident.human_intervened_at = timezone.now()
    incident.human_intervened_by = user
    incident.human_intervention_note = note
    incident.status = "dismissed"
    incident.resolved_at = timezone.now()
    incident.save(
        update_fields=[
            "human_intervened_at", "human_intervened_by", "human_intervention_note",
            "status", "resolved_at", "updated_at",
        ]
    )
    incident.actions.filter(status__in=["proposed", "awaiting_approval"]).update(status="skipped")

    last_step = incident.steps.order_by("-step_number").first()
    AgentStep.objects.create(
        incident=incident,
        step_number=(last_step.step_number if last_step else 0) + 1,
        role="final",
        tool_output=(
            f"Human intervention by {user}: {note}" if note else f"Human intervention by {user}."
        ),
    )
    return incident


def _finalize_incident(incident: Incident, decision: Optional[dict]) -> None:
    script_name = (decision or {}).get("script_name", "none") or "none"
    script_command = (decision or {}).get("script_command", "") or ""
    reasoning = (decision or {}).get("reasoning", "") or (
        "The agent did not reach a decision within the step limit; escalating for review."
    )
    confidence = (decision or {}).get("confidence") or "low"
    incident.confidence = confidence if confidence in ("high", "medium", "low") else "low"

    action: Optional[RemediationAction] = None
    if script_name.lower() != "none":
        policy = RemediationScriptPolicy.objects.filter(zabbix_script_name=script_name).first()

        if policy is None and script_command:
            # The agent wrote this command itself — scan it and always hold it for a
            # human, regardless of confidence. This is the hard guardrail against
            # destructive behavior: no amount of stated confidence lets freshly
            # authored code skip human review.
            violations = guardrails.check_script(script_command)
            dry_run = bool(getattr(settings, "AGENT_DRY_RUN", False))
            action = RemediationAction.objects.create(
                incident=incident,
                zabbix_script_name=script_name,
                reasoning=reasoning,
                confidence=incident.confidence,
                status="proposed",
                dry_run=dry_run,
                script_source="generated",
                generated_script_command=script_command,
                guardrail_violations=violations or None,
            )
            if violations:
                logger.warning(
                    "Incident %s: agent-authored script '%s' blocked by guardrails: %s",
                    incident.id, script_name, violations,
                )
                action.status = "failed"
                action.execution_result = {"blocked_by_guardrails": violations}
                action.save(update_fields=["status", "execution_result"])
            else:
                logger.info(
                    "Incident %s: agent-authored script '%s' passed guardrail scan; "
                    "awaiting human approval before it can run.",
                    incident.id, script_name,
                )
                action.status = "awaiting_approval"
                action.save(update_fields=["status"])
            incident.status = "escalated"
        else:
            violations: Optional[list] = None
            if policy is None:
                # A script registered in Zabbix (the agent picked it from
                # list_remediation_scripts) but never classified in
                # NetSentinel's policy registry. Rather than blocking every
                # never-before-seen script on a human pre-registering it,
                # scan its actual command text and classify it now: a clean
                # scan is remembered as low-risk/auto-executable, a flagged
                # one as high-risk/no-auto-execute — either way it still
                # needs confidence=='high' below, same as any other policy.
                command_text, violations = _lookup_and_scan_registered_script(
                    incident.zabbix_host_id, script_name
                )
                policy, _ = RemediationScriptPolicy.objects.get_or_create(
                    zabbix_script_name=script_name,
                    defaults={
                        "risk_level": "low" if not violations else "high",
                        "auto_execute_allowed": not violations,
                        "description": (
                            "Auto-classified from a static guardrail scan of its Zabbix "
                            f"command text, first seen on incident {incident.id}."
                            + (f" Flagged: {', '.join(violations)}." if violations else "")
                        ),
                    },
                )
                if violations:
                    logger.warning(
                        "Incident %s: newly-seen script '%s' failed the guardrail scan: %s",
                        incident.id, script_name, violations,
                    )
                else:
                    logger.info(
                        "Incident %s: newly-seen script '%s' passed the guardrail scan; "
                        "classified low-risk/auto-executable.",
                        incident.id, script_name,
                    )

            can_auto_execute = bool(policy.auto_execute_allowed and incident.confidence == "high")
            dry_run = bool(getattr(settings, "AGENT_DRY_RUN", False))

            action = RemediationAction.objects.create(
                incident=incident,
                zabbix_script_name=script_name,
                reasoning=reasoning,
                confidence=incident.confidence,
                status="proposed",
                dry_run=dry_run,
                guardrail_violations=violations or None,
            )

            if can_auto_execute and not dry_run:
                logger.info(
                    "Incident %s: auto-executing '%s' (policy allows, confidence=high)",
                    incident.id, script_name,
                )
                result = execute_remediation_script(incident.zabbix_host_id, script_name)
                action.status = "executed" if result.get("ok") else "failed"
                action.execution_result = result
                action.executed_at = timezone.now()
                action.save(update_fields=["status", "execution_result", "executed_at"])
                incident.status = "remediated" if result.get("ok") else "escalated"
            elif can_auto_execute and dry_run:
                logger.info(
                    "Incident %s: dry-run mode, skipping auto-execution of '%s'",
                    incident.id, script_name,
                )
                action.status = "skipped"
                action.execution_result = {"dry_run": True}
                action.save(update_fields=["status", "execution_result"])
                incident.status = "escalated"
            else:
                logger.info(
                    "Incident %s: '%s' requires human approval (auto_execute_allowed=%s, "
                    "confidence=%s)",
                    incident.id, script_name, policy.auto_execute_allowed, incident.confidence,
                )
                action.status = "awaiting_approval"
                action.save(update_fields=["status"])
                incident.status = "escalated"
    else:
        logger.info("Incident %s: no remediation proposed; escalating for human review.", incident.id)
        incident.status = "escalated"

    incident.resolved_at = timezone.now()
    incident.save(update_fields=["status", "confidence", "resolved_at", "updated_at"])

    context.log_step(
        "final",
        tool_name=script_name if script_name.lower() != "none" else None,
        tool_input=decision,
        tool_output=reasoning,
    )
    _notify(incident, action, reasoning)


def _notify(incident: Incident, action: Optional[RemediationAction], reasoning: str) -> None:
    title = f"[Incident Agent] {incident.host_name}: {incident.trigger_name}"
    lines = [
        f"Severity: {incident.severity}",
        f"Confidence: {incident.confidence or 'n/a'}",
        f"Status: {incident.get_status_display()}",
    ]
    if action:
        source = " [agent-authored]" if action.script_source == "generated" else ""
        lines.append(f"Action: {action.zabbix_script_name}{source} ({action.get_status_display()})")
        if action.guardrail_violations:
            lines.append(f"Guardrails: blocked — {', '.join(action.guardrail_violations)}")
    else:
        lines.append("Action: none proposed — escalated for human review")
    lines.append(f"Reasoning: {reasoning}")

    alert_type = "success" if incident.status == "remediated" else "warning"
    send_notification(title, "\n".join(lines), alert_type=alert_type)
