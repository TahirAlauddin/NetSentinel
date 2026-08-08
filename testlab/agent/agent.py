"""
NetSentinel Testlab — AI Remediation Agent
==========================================

Loop:
  1. Poll Zabbix for active problems (severity >= Warning).
  2. For each new problem, ask the LLM which remediation script to run.
  3. Execute the chosen script via `script.execute` on the affected host.
  4. Log the decision and outcome.

Usage
-----
    pip install -r requirements.txt
    cp ../.env.example .env   # fill in ZABBIX_URL, ZABBIX_USER/PASSWORD, OPENAI_API_KEY
    python agent.py
"""

from __future__ import annotations

import json, logging, os, sys, time
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
from openai import OpenAI

import playbook

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="-- %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("agent")

# ── Config ─────────────────────────────────────────────────────────────────────

load_dotenv()

ZABBIX_URL = os.getenv("ZABBIX_URL", "http://localhost:8090").rstrip("/")
ZABBIX_USER = os.getenv("ZABBIX_USER", "Admin")
ZABBIX_PASSWORD = os.getenv("ZABBIX_PASSWORD", "zabbix")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "30"))
DRY_RUN = os.getenv("DRY_RUN", "0") == "1"

ZABBIX_ENDPOINT = f"{ZABBIX_URL}/api_jsonrpc.php"
SEVERITY_LABELS = {0: "Not classified", 1: "Information", 2: "Warning", 3: "Average", 4: "High", 5: "Disaster"}

# ── Zabbix JSON-RPC helpers ────────────────────────────────────────────────────

_rpc_id = 0


def _rpc(session: requests.Session, method: str, params: dict) -> dict:
    global _rpc_id
    _rpc_id += 1
    body = {"jsonrpc": "2.0", "method": method, "params": params, "id": _rpc_id}
    r = session.post(ZABBIX_ENDPOINT, json=body, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"Zabbix [{method}] error: {data['error']}")
    return data["result"]


def zabbix_login(session: requests.Session) -> None:
    token = _rpc(session, "user.login", {"username": ZABBIX_USER, "password": ZABBIX_PASSWORD})
    session.headers["Authorization"] = f"Bearer {token}"
    log.info("Authenticated with Zabbix as %s", ZABBIX_USER)


def zabbix_session() -> requests.Session:
    s = requests.Session()
    s.headers["Content-Type"] = "application/json"
    zabbix_login(s)
    return s


# ── Zabbix data fetchers ───────────────────────────────────────────────────────

def fetch_active_problems(session: requests.Session) -> list[dict]:
    """Return active problems with severity >= Warning (2)."""
    return _rpc(session, "problem.get", {
        "output": "extend",
        "severities": [2, 3, 4, 5],
        "selectAcknowledges": "count",
        "sortfield": "eventid",
        "sortorder": "DESC",
    })


def fetch_trigger(session: requests.Session, triggerid: str) -> dict:
    result = _rpc(session, "trigger.get", {
        "triggerids": [triggerid],
        "output": ["triggerid", "description", "expression", "priority", "comments"],
        "selectHosts": ["hostid", "host"],
    })
    return result[0] if result else {}


def fetch_script_ids(session: requests.Session) -> dict[str, str]:
    """Return {script_name: scriptid} for all scripts known to playbook."""
    all_scripts = _rpc(session, "script.get", {
        "output": ["scriptid", "name"],
    })
    name_map = {s["name"]: s["scriptid"] for s in all_scripts}
    mapped: dict[str, str] = {}
    for entry in playbook.SCRIPTS:
        sid = name_map.get(entry["name"])
        if sid:
            mapped[entry["name"]] = sid
        else:
            log.warning("Script '%s' not found in Zabbix — run setup_zabbix.py first", entry["name"])
    return mapped


def execute_script(session: requests.Session, scriptid: str, hostid: str) -> dict:
    return _rpc(session, "script.execute", {"scriptid": scriptid, "hostid": hostid})


# ── AI decision ────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are NetSentinel's autonomous remediation agent.
You monitor a testlab of 5 Docker containers via Zabbix and automatically fix problems.

When given a Zabbix problem and a list of available remediation scripts, you must:
1. Analyse the problem carefully.
2. Pick exactly ONE script that best resolves it.
3. Return a JSON object with this exact shape:

{
  "chosen_script": "<script name>",
  "reasoning": "<one or two sentences explaining why>",
  "confidence": "high" | "medium" | "low"
}

If none of the scripts is appropriate, return:
{
  "chosen_script": null,
  "reasoning": "<why no action is appropriate>",
  "confidence": "low"
}

Rules:
- Do NOT invent script names. Only use names from the provided list.
- Prefer the least disruptive action (e.g. clear disk before restarting).
- A restart is always a valid last resort.
"""


def ask_llm(client: OpenAI, problem: dict, trigger: dict, host_scripts: list[dict]) -> dict:
    """Call the LLM and return the parsed decision dict."""
    host_name = trigger.get("hosts", [{}])[0].get("host", "unknown")
    severity = SEVERITY_LABELS.get(int(problem.get("severity", 0)), "Unknown")
    age_secs = int(time.time()) - int(problem.get("clock", 0))

    scripts_text = "\n".join(
        f"  - {s['name']}: {s['description']}" for s in host_scripts
    )

    user_msg = f"""\
ACTIVE PROBLEM
--------------
Host     : {host_name}
Trigger  : {trigger.get('description', 'N/A')}
Severity : {severity}
Age      : {age_secs}s
Comments : {trigger.get('comments', '').strip() or 'none'}

AVAILABLE SCRIPTS FOR THIS HOST
--------------------------------
{scripts_text}

Choose the single best remediation script from the list above.
"""
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    raw = response.choices[0].message.content or "{}"
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        log.error("LLM returned non-JSON: %s", raw)
        return {"chosen_script": None, "reasoning": "LLM parse error", "confidence": "low"}


# ── Logging helpers ────────────────────────────────────────────────────────────

def log_decision(problem: dict, trigger: dict, decision: dict, result: dict | None) -> None:
    host = trigger.get("hosts", [{}])[0].get("host", "?")
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    chosen = decision.get("chosen_script")
    separator = "─" * 60
    log.info(separator)
    log.info("[%s] Problem  : %s on %s", ts, trigger.get("description", "?"), host)
    log.info("           Script   : %s (%s confidence)", chosen, decision.get("confidence", "?"))
    log.info("           Reasoning: %s", decision.get("reasoning", ""))
    if result is not None:
        status = "SUCCESS" if result.get("response") else "UNKNOWN"
        log.info("           Outcome  : %s — %s", status, result.get("value", "")[:120])
    elif DRY_RUN:
        log.info("           Outcome  : DRY RUN — skipped execution")
    log.info(separator)


# ── Main loop ──────────────────────────────────────────────────────────────────

def run() -> None:
    if not OPENAI_API_KEY:
        log.error("OPENAI_API_KEY is not set. Export it or add it to .env")
        sys.exit(1)

    oai = OpenAI(api_key=OPENAI_API_KEY)
    session = zabbix_session()

    log.info("Fetching registered Zabbix script IDs …")
    script_ids = fetch_script_ids(session)
    log.info("Found %d known scripts in Zabbix", len(script_ids))

    if DRY_RUN:
        log.warning("DRY RUN mode — no scripts will be executed")

    # Track problems we've already acted on so we don't loop
    handled: set[str] = set()

    log.info("Agent polling every %ds. Ctrl-C to stop.", POLL_INTERVAL)

    while True:
        try:
            problems = fetch_active_problems(session)
        except Exception as exc:
            log.warning("Failed to fetch problems: %s — re-authenticating …", exc)
            try:
                session = zabbix_session()
                script_ids = fetch_script_ids(session)
            except Exception as e2:
                log.error("Re-auth failed: %s", e2)
            time.sleep(POLL_INTERVAL)
            continue

        new_problems = [p for p in problems if p["eventid"] not in handled]
        if new_problems:
            log.info("Found %d active problem(s), %d new", len(problems), len(new_problems))
        else:
            log.debug("No new problems (total active: %d)", len(problems))

        for problem in new_problems:
            event_id = problem["eventid"]
            trigger_id = problem["objectid"]

            try:
                trigger = fetch_trigger(session, trigger_id)
            except Exception as exc:
                log.warning("Could not fetch trigger %s: %s", trigger_id, exc)
                handled.add(event_id)
                continue

            host_name = (trigger.get("hosts") or [{}])[0].get("host", "")
            host_id = (trigger.get("hosts") or [{}])[0].get("hostid", "")
            host_scripts = playbook.scripts_for_host(host_name)

            if not host_scripts:
                log.info("No scripts registered for host '%s' — skipping", host_name)
                handled.add(event_id)
                continue

            log.info("Asking LLM about: [%s] %s", host_name, trigger.get("description", "?"))
            try:
                decision = ask_llm(oai, problem, trigger, host_scripts)
            except Exception as exc:
                log.error("LLM call failed: %s", exc)
                handled.add(event_id)
                continue

            chosen_name = decision.get("chosen_script")
            exec_result: dict | None = None

            if chosen_name and not DRY_RUN:
                script_entry = playbook.script_by_name(chosen_name)
                sid = script_ids.get(chosen_name) if script_entry else None
                if sid and host_id:
                    try:
                        exec_result = execute_script(session, sid, host_id)
                    except Exception as exc:
                        log.error("script.execute failed for '%s': %s", chosen_name, exc)
                else:
                    log.warning("Script '%s' has no Zabbix ID — run setup_zabbix.py", chosen_name)

            log_decision(problem, trigger, decision, exec_result)
            handled.add(event_id)

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        log.info("Agent stopped.")
