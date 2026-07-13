"""
Tool functions for the incident response ReAct loop, decorated with @beta_tool
(Anthropic Python SDK Tool Runner — see shared/tool-use-concepts.md). Each function
is called automatically by client.beta.messages.tool_runner(); its return value
(a string) is sent back to the model as the tool_result.

Reuses monitoring.zabbix_client.get_zabbix_client() (the shared lib/zabbix client)
rather than a new hand-rolled RPC client — unlike testlab/agent/agent.py.
"""

from __future__ import annotations

import time

from anthropic import beta_tool
from django.db.models import Q

from monitoring.zabbix_client import get_zabbix_client

from ..models import RemediationScriptPolicy, ZabbixHostLink
from . import context

SEVERITY_LABELS = {
    "0": "Not classified",
    "1": "Information",
    "2": "Warning",
    "3": "Average",
    "4": "High",
    "5": "Disaster",
}


def _log_result(tool_name: str, tool_input: dict, result: str) -> str:
    context.log_step("tool_result", tool_name=tool_name, tool_input=tool_input, tool_output=result)
    return result


@beta_tool
def get_problem_detail(event_id: str) -> str:
    """Get full detail for the Zabbix problem that triggered this incident, including
    the trigger expression, host, and recent history for the underlying item.

    Args:
        event_id: The Zabbix event ID (eventid) for this problem.
    """
    tool_input = {"event_id": event_id}
    try:
        client = get_zabbix_client()
        problems = client.problems.get(
            eventids=[event_id], output="extend", selectTags="extend"
        )
        if not problems:
            return _log_result(
                "get_problem_detail", tool_input, f"No Zabbix problem found for event {event_id}."
            )
        problem = problems[0]
        trigger_id = problem.get("objectid")
        triggers = client.triggers.get(
            triggerids=[trigger_id] if trigger_id else [],
            output="extend",
            selectHosts=["hostid", "host", "name"],
            selectItems=["itemid", "name", "key_", "value_type"],
        )
        trigger = triggers[0] if triggers else {}
        hosts = trigger.get("hosts") or []
        host_name = hosts[0].get("name") if hosts else "unknown host"
        items = trigger.get("items") or []

        lines = [
            f"Host: {host_name}",
            f"Trigger: {trigger.get('description', 'N/A')}",
            f"Expression: {trigger.get('expression', 'N/A')}",
            f"Severity: {SEVERITY_LABELS.get(str(problem.get('severity', 0)), 'Unknown')}",
            f"Comments: {trigger.get('comments', '').strip() or 'none'}",
        ]

        for item in items[:3]:
            try:
                history = client.history.get(
                    history_type=int(item.get("value_type", 3)),
                    itemids=[item["itemid"]],
                    time_from=int(time.time()) - 3600,
                    sortfield="clock",
                    sortorder="DESC",
                    limit=10,
                )
            except Exception:  # noqa: BLE001 - degrade gracefully, keep the loop going
                history = []
            values = ", ".join(h.get("value", "") for h in history) or "no recent data"
            lines.append(f"Item '{item.get('name')}' recent values (newest first): {values}")

        return _log_result("get_problem_detail", tool_input, "\n".join(lines))
    except Exception as exc:  # noqa: BLE001
        return _log_result(
            "get_problem_detail", tool_input, f"Error querying Zabbix: {exc}"
        )


@beta_tool
def get_host_recent_problems(host_id: str, hours: int = 24) -> str:
    """List other problems on the same Zabbix host in the recent time window, to help
    spot correlated failures (e.g. disk full causing both a service crash and a
    connectivity alert).

    Args:
        host_id: The Zabbix host ID (hostid).
        hours: How many hours back to look. Defaults to 24.
    """
    tool_input = {"host_id": host_id, "hours": hours}
    try:
        client = get_zabbix_client()
        problems = client.problems.get(
            hostids=[host_id],
            time_from=int(time.time()) - hours * 3600,
            output="extend",
            selectTags="extend",
            sortfield="eventid",
            sortorder="DESC",
            limit=20,
        )
        if not problems:
            return _log_result(
                "get_host_recent_problems",
                tool_input,
                f"No other problems on this host in the last {hours}h.",
            )
        lines = [
            f"- [{SEVERITY_LABELS.get(str(p.get('severity', 0)), '?')}] "
            f"event {p.get('eventid')}: {p.get('name', 'N/A')}"
            for p in problems
        ]
        return _log_result("get_host_recent_problems", tool_input, "\n".join(lines))
    except Exception as exc:  # noqa: BLE001
        return _log_result("get_host_recent_problems", tool_input, f"Error querying Zabbix: {exc}")


@beta_tool
def get_asset_context(zabbix_host_id: str) -> str:
    """Look up the NetSentinel asset/device linked to this Zabbix host (asset tag,
    location, department, device type, vendor/model), from the cached host↔asset
    correlation maintained by the sync_zabbix_host_links job.

    Args:
        zabbix_host_id: The Zabbix host ID (hostid).
    """
    tool_input = {"zabbix_host_id": zabbix_host_id}
    link = (
        ZabbixHostLink.objects.filter(zabbix_host_id=zabbix_host_id)
        .select_related("resolved_asset", "resolved_device")
        .first()
    )
    if not link or (not link.resolved_asset and not link.resolved_device):
        return _log_result(
            "get_asset_context",
            tool_input,
            "No NetSentinel asset or device is linked to this Zabbix host yet "
            "(host↔asset sync hasn't matched it — treat host identity as unverified).",
        )
    lines = []
    if link.resolved_device:
        d = link.resolved_device
        lines.append(
            f"Device: {d.name} ({d.device_type or 'unknown type'}), "
            f"vendor={d.vendor or 'n/a'}, model={d.model or 'n/a'}, "
            f"location={d.location or 'n/a'}, active={d.is_active}"
        )
    if link.resolved_asset:
        a = link.resolved_asset
        lines.append(
            f"Asset: {a.name} (tag={a.asset_tag or 'n/a'}, status={a.status}, "
            f"category={a.category})"
        )
    return _log_result("get_asset_context", tool_input, "\n".join(lines))


@beta_tool
def search_past_incidents(query: str) -> str:
    """Search NetSentinel's history of incidents this agent has previously
    investigated and remediated, for guidance relevant to this problem (e.g. how a
    similar alert was resolved before).

    Args:
        query: Free-text search — trigger name, symptom, or host name works well.
    """
    tool_input = {"query": query}
    from ..models import Incident  # local import: avoid a cycle at module load time

    past = (
        Incident.objects.filter(
            Q(trigger_name__icontains=query)
            | Q(host_name__icontains=query)
            | Q(actions__reasoning__icontains=query),
            status__in=["remediated", "resolved"],
        )
        .distinct()
        .prefetch_related("actions")[:5]
    )

    results: list[str] = []
    for incident in past:
        action = incident.actions.order_by("-created_at").first()
        if action:
            results.append(
                f"Past incident on {incident.host_name} ({incident.trigger_name}): "
                f"ran '{action.zabbix_script_name}' — {action.reasoning[:300]}"
            )

    if not results:
        return _log_result("search_past_incidents", tool_input, "No matching past incidents found.")
    return _log_result("search_past_incidents", tool_input, "\n".join(results))


@beta_tool
def list_remediation_scripts(host_id: str) -> str:
    """List remediation scripts registered in Zabbix for this host, with each
    script's risk classification from NetSentinel's policy registry. Only scripts
    listed here are valid choices for propose_remediation.

    Args:
        host_id: The Zabbix host ID (hostid).
    """
    tool_input = {"host_id": host_id}
    try:
        client = get_zabbix_client()
        scripts = client.scripts.get(hostids=[host_id], output="extend")
        if not scripts:
            return _log_result(
                "list_remediation_scripts",
                tool_input,
                "No remediation scripts are registered in Zabbix for this host.",
            )
        names = [s.get("name", "") for s in scripts]
        policies = {
            p.zabbix_script_name: p
            for p in RemediationScriptPolicy.objects.filter(zabbix_script_name__in=names)
        }
        lines = []
        for s in scripts:
            name = s.get("name", "")
            policy = policies.get(name)
            if policy:
                risk = f"risk={policy.risk_level}, auto_execute_allowed={policy.auto_execute_allowed}"
            else:
                risk = "unclassified in NetSentinel policy — treat as high risk, do not auto-execute"
            lines.append(f"- {name}: {risk}")
        return _log_result("list_remediation_scripts", tool_input, "\n".join(lines))
    except Exception as exc:  # noqa: BLE001
        return _log_result("list_remediation_scripts", tool_input, f"Error querying Zabbix: {exc}")


@beta_tool
def propose_remediation(script_name: str, reasoning: str, confidence: str) -> str:
    """Finalize your diagnosis and remediation decision. Call this exactly once, as
    your last action, after you've gathered enough context to decide. Use
    script_name="none" if no remediation script is appropriate (e.g. this needs
    human judgment).

    Args:
        script_name: Exact name of the script to run (must be one from
            list_remediation_scripts), or "none".
        reasoning: One or two sentences explaining the root-cause hypothesis and why
            this action (or no action) is appropriate.
        confidence: Your confidence in this decision — "high", "medium", or "low".
            Only use "high" when you're confident the root cause and fix are correct.
    """
    tool_input = {"script_name": script_name, "reasoning": reasoning, "confidence": confidence}
    return _log_result(
        "propose_remediation", tool_input, "Decision recorded. Investigation complete."
    )
