"""
Anthropic client factory for the incident response agent.

Uses the official `anthropic` SDK (not raw HTTP / OpenAI, unlike the testlab
prototype at testlab/agent/agent.py). Model defaults to Claude Opus 4.8 — this is a
background/service workload, not an interactive chat UI, so AGENT_MODEL can be
overridden (e.g. to a cheaper Sonnet-tier model) via settings/env if cost matters
more than best-available reasoning; the default should not be silently downgraded.
"""

from __future__ import annotations

import anthropic
from django.conf import settings


def get_client() -> anthropic.Anthropic:
    """
    Build an Anthropic client. Reads ANTHROPIC_API_KEY from settings, which mirrors
    the SDK's own environment-variable resolution — no custom auth handling here.
    """
    api_key = getattr(settings, "ANTHROPIC_API_KEY", "") or None
    return anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()


def get_model() -> str:
    return getattr(settings, "AGENT_MODEL", "claude-opus-4-8")
