"""
OpenAI client factory for the incident response agent.

Uses the official `openai` SDK's Chat Completions API with manual function
calling — unlike the testlab prototype at testlab/agent/agent.py (a single
one-shot completion with response_format=json_object), this agent runs a
multi-turn tool loop (see agent_loop.py), so it drives chat.completions.create
directly rather than a higher-level single-response helper.

Model defaults to a full-tier model, not the cheap "-mini" variant the testlab
prototype uses for cost — this is a background/service workload making real
remediation decisions, so AGENT_MODEL can be overridden via settings/env if
cost matters more than best-available reasoning, but the default should not be
silently downgraded.
"""

from __future__ import annotations

import openai
from django.conf import settings


def get_client() -> openai.OpenAI:
    """
    Build an OpenAI client. Reads OPENAI_API_KEY from settings, which mirrors
    the SDK's own environment-variable resolution — no custom auth handling here.
    """
    api_key = getattr(settings, "OPENAI_API_KEY", "") or None
    return openai.OpenAI(api_key=api_key) if api_key else openai.OpenAI()


def get_model() -> str:
    return getattr(settings, "AGENT_MODEL", "gpt-4o")
