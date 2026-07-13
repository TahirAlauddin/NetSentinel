"""
The ReAct loop core: given a Zabbix event_id, create an Incident, let the model
investigate with tools, apply the confidence gate, execute (or hold for approval)
a remediation, and always post a diagnostic report to Slack/Discord.

This function is invocation-agnostic — run_incident_agent.py calls it from a
ThreadPoolExecutor today; swapping to a Celery task later requires no changes here.
"""

from __future__ import annotations

import logging
from typing import Optional

from django.conf import settings
from django.utils import timezone

from monitoring.zabbix_client import get_zabbix_client
from notifications.services import send_notification

from ..models import Incident, RemediationAction, RemediationScriptPolicy
from . import context
from .agent_tools import (
    SEVERITY_LABELS,
    get_asset_context,
    get_host_recent_problems,
    get_problem_detail,
    list_remediation_scripts,
    propose_remediation,
    search_past_incidents,
)
from .llm_client import get_client, get_model

logger = logging.getLogger(__name__)

MAX_MESSAGES = 20

SYSTEM_PROMPT = (
    "You are NetSentinel's autonomous incident response agent. You investigate Zabbix "
    "alerts using the provided tools (problem/trigger detail, host history, linked "
    "asset context, this agent's own history of past incidents, and the host's "
    "registered remediation scripts) to form a root-cause hypothesis. Prefer the "
    "least disruptive action. Only report 'high' "
    "confidence when the evidence clearly supports both the root cause and the fix — "
    "when uncertain, use 'medium' or 'low' so a human reviews it instead of an "
    "automated action running unsupervised. Call propose_remediation exactly once, as "
    "your last action, once you have enough information to decide."
)


def run_agent_loop(event_id: str) -> None:
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
        logger.info("Event %s already has an Incident; skipping duplicate run.", event_id)
        return

    context.start_incident_context(incident)

    decision: Optional[dict] = None
    try:
        anthropic_client = get_client()
        runner = anthropic_client.beta.messages.tool_runner(
            model=get_model(),
            max_tokens=8000,
            system=SYSTEM_PROMPT,
            thinking={"type": "adaptive"},
            output_config={"effort": "high"},
            tools=[
                get_problem_detail,
                get_host_recent_problems,
                get_asset_context,
                search_past_incidents,
                list_remediation_scripts,
                propose_remediation,
            ],
            messages=[
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
                }
            ],
        )

        messages_seen = 0
        for message in runner:
            messages_seen += 1
            for block in message.content:
                if block.type == "thinking":
                    context.log_step("thinking", tool_output=block.thinking)
                elif block.type == "text":
                    context.log_step("thinking", tool_output=block.text)
                elif block.type == "tool_use":
                    context.log_step("tool_call", tool_name=block.name, tool_input=block.input)
                    if block.name == "propose_remediation":
                        decision = dict(block.input)
            if decision is not None or messages_seen >= MAX_MESSAGES:
                break
    except Exception as exc:  # noqa: BLE001
        logger.exception("Agent loop failed for incident %s", incident.id)
        context.log_step("final", tool_output=f"Agent loop error: {exc}")

    _finalize_incident(incident, decision)


def execute_remediation_script(host_id: str, script_name: str) -> dict:
    """Look up and execute a Zabbix script by name against a host, via lib/zabbix."""
    try:
        client = get_zabbix_client()
        scripts = client.scripts.get(
            hostids=[host_id], output="extend", filter={"name": script_name}
        )
        if not scripts:
            return {"ok": False, "error": f"Script '{script_name}' not found for host {host_id}."}
        result = client.scripts.execute(scriptid=scripts[0]["scriptid"], hostid=host_id)
        return {"ok": bool(result.get("response")), "raw": result}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": str(exc)}


def _finalize_incident(incident: Incident, decision: Optional[dict]) -> None:
    script_name = (decision or {}).get("script_name", "none") or "none"
    reasoning = (decision or {}).get("reasoning", "") or (
        "The agent did not reach a decision within the step limit; escalating for review."
    )
    confidence = (decision or {}).get("confidence") or "low"
    incident.confidence = confidence if confidence in ("high", "medium", "low") else "low"

    action: Optional[RemediationAction] = None
    if script_name.lower() != "none":
        policy = RemediationScriptPolicy.objects.filter(zabbix_script_name=script_name).first()
        can_auto_execute = bool(
            policy and policy.auto_execute_allowed and incident.confidence == "high"
        )
        dry_run = bool(getattr(settings, "AGENT_DRY_RUN", False))

        action = RemediationAction.objects.create(
            incident=incident,
            zabbix_script_name=script_name,
            reasoning=reasoning,
            confidence=incident.confidence,
            status="proposed",
            dry_run=dry_run,
        )

        if can_auto_execute and not dry_run:
            result = execute_remediation_script(incident.zabbix_host_id, script_name)
            action.status = "executed" if result.get("ok") else "failed"
            action.execution_result = result
            action.executed_at = timezone.now()
            action.save(update_fields=["status", "execution_result", "executed_at"])
            incident.status = "remediated" if result.get("ok") else "escalated"
        elif can_auto_execute and dry_run:
            action.status = "skipped"
            action.execution_result = {"dry_run": True}
            action.save(update_fields=["status", "execution_result"])
            incident.status = "escalated"
        else:
            action.status = "awaiting_approval"
            action.save(update_fields=["status"])
            incident.status = "escalated"
    else:
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
        lines.append(f"Action: {action.zabbix_script_name} ({action.get_status_display()})")
    else:
        lines.append("Action: none proposed — escalated for human review")
    lines.append(f"Reasoning: {reasoning}")

    alert_type = "success" if incident.status == "remediated" else "warning"
    send_notification(title, "\n".join(lines), alert_type=alert_type)
