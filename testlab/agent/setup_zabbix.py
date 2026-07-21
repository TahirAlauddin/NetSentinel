"""
Bootstrap the Zabbix testlab via the Zabbix API.

Run once after `docker compose up` and the Zabbix web UI has started:

    python setup_zabbix.py

What it does
------------
1. Logs in to Zabbix with admin credentials.
2. Creates a "TestLab Hosts" host group.
3. Registers the 5 simulated hosts (web-server, app-server, db-server,
   cache-server, worker-server) and links the Linux-by-Zabbix-agent template.
4. Creates one Zabbix "Script" per entry in playbook.py so the AI agent
   can call `script.execute`.

Environment variables (set in .env or export before running)
-------------------------------------------------------------
ZABBIX_URL      http://localhost:8090     Zabbix frontend URL
ZABBIX_USER     Admin
ZABBIX_PASSWORD zabbix
"""

from __future__ import annotations

import os
import sys
import time

import requests
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()

ZABBIX_URL = os.getenv("ZABBIX_URL", "http://localhost:8090").rstrip("/")
ZABBIX_USER = os.getenv("ZABBIX_USER", "Admin")
ZABBIX_PASSWORD = os.getenv("ZABBIX_PASSWORD", "zabbix")
ENDPOINT = f"{ZABBIX_URL}/api_jsonrpc.php"

# Template that ships with Zabbix and covers Linux metrics
LINUX_TEMPLATE_NAME = "Linux by Zabbix agent"

# Hosts to register — name must match ZBX_HOSTNAME env var in docker-compose
HOSTS = [
    {"name": "web-server",    "agent_dns": "agent-web-server"},
    {"name": "app-server",    "agent_dns": "agent-app-server"},
    {"name": "db-server",     "agent_dns": "agent-db-server"},
    {"name": "cache-server",  "agent_dns": "agent-cache-server"},
    {"name": "worker-server", "agent_dns": "agent-worker-server"},
]

_id = 0


def _rpc(session: requests.Session, method: str, params: dict, auth: str | None = None) -> dict:
    global _id
    _id += 1
    body = {"jsonrpc": "2.0", "method": method, "params": params, "id": _id}
    if auth:
        session.headers["Authorization"] = f"Bearer {auth}"
    r = session.post(ENDPOINT, json=body, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"Zabbix API error [{method}]: {data['error']}")
    return data["result"]


def wait_for_zabbix(session: requests.Session, retries: int = 30, delay: int = 5) -> None:
    print(f"Waiting for Zabbix at {ENDPOINT} …")
    for attempt in range(1, retries + 1):
        try:
            r = session.post(
                ENDPOINT,
                json={"jsonrpc": "2.0", "method": "apiinfo.version", "params": {}, "id": 0},
                timeout=5,
            )
            if r.status_code == 200:
                version = r.json().get("result", "?")
                print(f"  ✓ Zabbix API ready (v{version})")
                return
        except Exception:
            pass
        print(f"  … attempt {attempt}/{retries}, retrying in {delay}s")
        time.sleep(delay)
    print("ERROR: Zabbix API did not become ready in time.", file=sys.stderr)
    sys.exit(1)


def login(session: requests.Session) -> str:
    token = _rpc(session, "user.login", {"username": ZABBIX_USER, "password": ZABBIX_PASSWORD})
    print(f"  ✓ Logged in as {ZABBIX_USER}")
    return token


def ensure_hostgroup(session: requests.Session, token: str, name: str) -> str:
    existing = _rpc(session, "hostgroup.get", {"filter": {"name": [name]}, "output": ["groupid"]}, token)
    if existing:
        gid = existing[0]["groupid"]
        print(f"  · Host group '{name}' already exists (id={gid})")
        return gid
    result = _rpc(session, "hostgroup.create", {"name": name}, token)
    gid = result["groupids"][0]
    print(f"  ✓ Created host group '{name}' (id={gid})")
    return gid


def get_template_id(session: requests.Session, token: str, name: str) -> str | None:
    result = _rpc(session, "template.get", {"filter": {"host": [name]}, "output": ["templateid"]}, token)
    if result:
        return result[0]["templateid"]
    print(f"  ! Template '{name}' not found — hosts will be created without it")
    return None


def ensure_host(session: requests.Session, token: str, host: dict, groupid: str, templateid: str | None) -> str:
    existing = _rpc(session, "host.get", {"filter": {"host": [host["name"]]}, "output": ["hostid"]}, token)
    if existing:
        hid = existing[0]["hostid"]
        print(f"  · Host '{host['name']}' already exists (id={hid})")
        return hid

    params: dict = {
        "host": host["name"],
        "groups": [{"groupid": groupid}],
        "interfaces": [
            {
                "type": 1,          # Zabbix agent
                "main": 1,
                "useip": 0,         # use DNS
                "ip": "",
                "dns": host["agent_dns"],
                "port": "10050",
            }
        ],
    }
    if templateid:
        params["templates"] = [{"templateid": templateid}]

    result = _rpc(session, "host.create", params, token)
    hid = result["hostids"][0]
    print(f"  ✓ Registered host '{host['name']}' (id={hid})")
    return hid


def ensure_script(session: requests.Session, token: str, script: dict) -> str:
    """Create a Zabbix Script if it doesn't exist yet, or update it if the command changed."""
    existing = _rpc(
        session, "script.get",
        {"filter": {"name": [script["name"]]}, "output": ["scriptid", "command"]}, token,
    )
    if existing:
        sid = existing[0]["scriptid"]
        if existing[0]["command"] != script["command"]:
            _rpc(session, "script.update", {"scriptid": sid, "command": script["command"]}, token)
            print(f"  ↻ Updated script '{script['name']}' command (id={sid})")
        else:
            print(f"  · Script '{script['name']}' already exists (id={sid})")
        return sid

    params = {
        "name": script["name"],
        "command": script["command"],
        "type": 0,          # Script (shell)
        "execute_on": 1,    # Zabbix server (has docker.sock)
        "scope": 2,         # Manual host action — callable via script.execute
        "description": script["description"],
    }
    result = _rpc(session, "script.create", params, token)
    sid = result["scriptids"][0]
    print(f"  ✓ Created script '{script['name']}' (id={sid})")
    return sid


def ensure_item(
    session: requests.Session,
    token: str,
    host_name: str,
    hostid: str,
    interfaceid: str,
    key: str,
    name: str,
    value_type: int = 3,
    delay: str = "30s",
) -> str:
    """Create a Zabbix agent (passive) item if it doesn't exist yet; return its itemid."""
    existing = _rpc(session, "item.get", {"hostids": [hostid], "filter": {"key_": key}, "output": ["itemid"]}, token)
    if existing:
        iid = existing[0]["itemid"]
        print(f"  · Item '{name}' already exists on {host_name} (id={iid})")
        return iid

    params = {
        "name": name,
        "key_": key,
        "hostid": hostid,
        "type": 0,          # Zabbix agent (passive)
        "value_type": value_type,  # 3 = numeric (unsigned)
        "interfaceid": interfaceid,
        "delay": delay,
    }
    result = _rpc(session, "item.create", params, token)
    iid = result["itemids"][0]
    print(f"  ✓ Created item '{name}' on {host_name} (id={iid})")
    return iid


def ensure_trigger(session: requests.Session, token: str, description: str, expression: str, priority: int = 3) -> str:
    """Create a Zabbix trigger if it doesn't exist yet; return its triggerid."""
    existing = _rpc(session, "trigger.get", {"filter": {"description": description}, "output": ["triggerid"]}, token)
    if existing:
        tid = existing[0]["triggerid"]
        print(f"  · Trigger '{description}' already exists (id={tid})")
        return tid

    params = {
        "description": description,
        "expression": expression,
        "priority": priority,
    }
    result = _rpc(session, "trigger.create", params, token)
    tid = result["triggerids"][0]
    print(f"  ✓ Created trigger '{description}' (id={tid})")
    return tid


def main() -> None:
    from playbook import SCRIPTS  # noqa: PLC0415

    session = requests.Session()
    session.headers["Content-Type"] = "application/json"

    wait_for_zabbix(session)

    print("\n── Authentication ──────────────────────────────")
    token = login(session)

    print("\n── Host group ──────────────────────────────────")
    groupid = ensure_hostgroup(session, token, "TestLab Hosts")

    print("\n── Template lookup ─────────────────────────────")
    templateid = get_template_id(session, token, LINUX_TEMPLATE_NAME)

    print("\n── Hosts ────────────────────────────────────────")
    host_ids: dict[str, str] = {}
    for host in HOSTS:
        host_ids[host["name"]] = ensure_host(session, token, host, groupid, templateid)

    print("\n── Remediation scripts ─────────────────────────")
    script_ids: dict[str, str] = {}
    for script in SCRIPTS:
        sid = ensure_script(session, token, script)
        script_ids[script["name"]] = sid

    print("\n── Custom items & triggers ──────────────────────")
    db_hostid = host_ids["db-server"]
    db_host = _rpc(session, "host.get", {
        "hostids": [db_hostid],
        "output": ["hostid"],
        "selectInterfaces": ["interfaceid"],
    }, token)[0]
    db_interfaceid = db_host["interfaces"][0]["interfaceid"]

    ensure_item(
        session, token, "db-server", db_hostid, db_interfaceid,
        key="system.run[/usr/local/bin/check_connections.sh]",
        name="PostgreSQL active connections (appdb)",
    )
    ensure_trigger(
        session, token,
        description="PostgreSQL connection pool near exhaustion on db-server",
        expression="last(/db-server/system.run[/usr/local/bin/check_connections.sh])>=15",
        priority=3,  # Average
    )

    # app-server's "Linux by Zabbix agent" memory item (vm.memory.size[pavailable])
    # reads /proc/meminfo on the *host* VM, not the container's own 512m mem_limit
    # cgroup, so /leak never moves it. proc.mem[] instead sums RSS of matching
    # processes read via /proc/<pid>/status, which the sidecar can see directly
    # thanks to `pid: service:app-server` in docker-compose.yml — accurate
    # regardless of cgroup limits.
    app_hostid = host_ids["app-server"]
    app_host = _rpc(session, "host.get", {
        "hostids": [app_hostid],
        "output": ["hostid"],
        "selectInterfaces": ["interfaceid"],
    }, token)[0]
    app_interfaceid = app_host["interfaces"][0]["interfaceid"]

    ensure_item(
        session, token, "app-server", app_hostid, app_interfaceid,
        key="proc.mem[uvicorn]",
        name="app-server uvicorn process RSS",
    )
    ensure_trigger(
        session, token,
        description="app-server memory leak (uvicorn RSS > 300MB)",
        expression="last(/app-server/proc.mem[uvicorn])>300M",
        priority=3,  # Average
    )

    print("\n── Done ─────────────────────────────────────────")
    print("Script IDs (save these or let agent.py discover them at startup):")
    for name, sid in script_ids.items():
        print(f"  {name}: {sid}")


if __name__ == "__main__":
    main()
