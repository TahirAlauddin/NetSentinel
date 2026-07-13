"""
Per-thread "current incident" context used by the tool functions in agent_tools.py
to self-log AgentStep rows without every tool needing an incident_id parameter in
its LLM-facing schema.

Backed by contextvars, which give independent state per OS thread by default (no
explicit context-copy across threads) — safe for run_incident_agent.py's
ThreadPoolExecutor, where each worker thread handles exactly one incident.
"""

from __future__ import annotations

import contextvars
from typing import Optional

_current_incident: "contextvars.ContextVar" = contextvars.ContextVar("remediation_current_incident")
_step_counter: "contextvars.ContextVar" = contextvars.ContextVar("remediation_step_counter")


def start_incident_context(incident) -> None:
    _current_incident.set(incident)
    _step_counter.set([0])


def log_step(
    role: str,
    *,
    tool_name: Optional[str] = None,
    tool_input: Optional[dict] = None,
    tool_output: Optional[str] = None,
) -> None:
    from .. import models  # local import to avoid a module-load-time app-registry dependency

    incident = _current_incident.get(None)
    if incident is None:
        return
    counter = _step_counter.get(None)
    if counter is None:
        counter = [0]
        _step_counter.set(counter)
    counter[0] += 1
    models.AgentStep.objects.create(
        incident=incident,
        step_number=counter[0],
        role=role,
        tool_name=tool_name,
        tool_input=tool_input,
        tool_output=tool_output,
    )
