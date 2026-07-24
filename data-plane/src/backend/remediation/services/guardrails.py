"""
Static guardrail checks for remediation scripts the agent writes itself.

A script picked from ``list_remediation_scripts`` was already vetted once by a
human (it's registered in Zabbix and carries a RemediationScriptPolicy risk
rating). A script the agent *authors on the spot* has no such history — it's
freshly generated shell text about to run against real infrastructure, so it
gets scanned here before it's ever stored or handed to an approver.

This is a coarse, defense-in-depth net (regex over command text), not a
sandboxed execution guarantee. It exists to catch the categories of mistake
that turn "restart the service" into "wipe the host": destructive filesystem
ops, destructive SQL, power-state changes, remote-code-execution patterns, and
credential exposure. It is intentionally not exhaustive — see
``services/agent_loop.py`` for the second, non-negotiable guardrail: generated
scripts never auto-execute, regardless of confidence or how clean they scan.
"""

from __future__ import annotations

import re

MAX_COMMAND_LENGTH = 2000

# (pattern, human-readable reason). Matched case-insensitively against the
# full command text. Keep patterns specific enough to avoid flagging normal
# restart/reload/clear-log style remediations.
_DESTRUCTIVE_PATTERNS: list[tuple[str, str]] = [
    (
        r"rm\s+(-\w+\s+)*-[a-z]*r[a-z]*f[a-z]*(\s+-\w+)*\s+/(\s|$)",
        "recursive force-delete of the root filesystem",
    ),
    (
        r"rm\s+(-\w+\s+)*-[a-z]*f[a-z]*r[a-z]*(\s+-\w+)*\s+/(\s|$)",
        "recursive force-delete of the root filesystem",
    ),
    (r"rm\s+-rf\s+/\*", "recursive force-delete of the root filesystem"),
    (r"\bmkfs(\.\w+)?\b", "filesystem creation — destroys existing data on the target device"),
    (r"\bdd\s+if=", "raw block-device write"),
    (r">\s*/dev/sd[a-z0-9]", "raw disk overwrite"),
    (r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:", "fork bomb"),
    (r"\b(shutdown|reboot|poweroff)\b", "host power-state change"),
    (r"\bhalt\b", "host power-state change"),
    (r"\binit\s+0\b", "host power-state change"),
    (r"\biptables\s+(-F|--flush)\b", "firewall flush"),
    (r"\bufw\s+disable\b", "firewall disable"),
    (r"\bdrop\s+(table|database)\b", "destructive SQL DDL (DROP)"),
    (r"\btruncate\s+table\b", "destructive SQL DDL (TRUNCATE)"),
    (r"\bdelete\s+from\s+\w+\s*;?\s*$", "unfiltered DELETE with no WHERE clause"),
    (r"\bchmod\s+(-\w+\s+)*777\b", "world-writable permission change"),
    (r"\bchown\s+-R\b[^\n]*\broot\b", "recursive ownership change to root"),
    (
        r"(curl|wget)[^\n|]*\|\s*(sudo\s+)?(sh|bash|python\d?)\b",
        "remote script piped directly into a shell",
    ),
    (r"\bdocker\s+(rm|kill|stop)\s+-?f?\s*\$\(\s*docker\s+ps", "bulk container kill/removal"),
    (r"\bcat\s+/etc/shadow\b", "credential file exposure"),
    (r"\buserdel\b|\bdeluser\b", "account deletion"),
    (r"\b(nc|netcat)\s+-l[a-z]*\b", "opens a listening shell/backdoor"),
    (r"\bcurl\b[^\n]*\b(shadow|id_rsa|\.ssh|/etc/passwd)\b", "likely credential exfiltration"),
]


def check_script(command: str) -> list[str]:
    """
    Scan an agent-authored command for destructive patterns.

    Returns a list of violation descriptions; an empty list means the script
    passed this static check (it may still be blocked by human approval —
    see agent_loop._finalize_incident).
    """
    if not command or not command.strip():
        return ["empty command"]

    violations: list[str] = []
    if len(command) > MAX_COMMAND_LENGTH:
        violations.append(f"command exceeds {MAX_COMMAND_LENGTH} characters")

    for pattern, reason in _DESTRUCTIVE_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            violations.append(reason)

    return violations
