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

# Hosts to register — name must match Hostname= in each host's
# zabbix_agent.conf (or ZBX_HOSTNAME env var for db-server's separate agent
# container). web/app/cache/worker-server run their Zabbix agent co-located
# in the same container as the service itself (see their Dockerfiles), so
# their agent_dns is just the host's own compose service name; db-server
# still has a separate sidecar agent container.
HOSTS = [
    {"name": "web-server",    "agent_dns": "web-server"},
    {"name": "app-server",    "agent_dns": "app-server"},
    {"name": "db-server",     "agent_dns": "agent-db-server"},
    {"name": "cache-server",  "agent_dns": "cache-server"},
    {"name": "worker-server", "agent_dns": "worker-server"},
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
    """Create the host if it doesn't exist yet, or fix its agent interface DNS if
    it's drifted from *host* (e.g. re-running this after moving the Zabbix agent
    into the host's own container must actually repoint it, not leave it stuck
    pointing at a now-gone sidecar agent container)."""
    existing = _rpc(
        session, "host.get",
        {"filter": {"host": [host["name"]]}, "output": ["hostid"], "selectInterfaces": ["interfaceid", "dns"]},
        token,
    )
    if existing:
        hid = existing[0]["hostid"]
        interfaces = existing[0].get("interfaces") or []
        current_dns = interfaces[0].get("dns") if interfaces else None
        if interfaces and current_dns != host["agent_dns"]:
            _rpc(
                session, "hostinterface.update",
                {"interfaceid": interfaces[0]["interfaceid"], "dns": host["agent_dns"]}, token,
            )
            print(f"  ↻ Updated host '{host['name']}' interface DNS: {current_dns!r} → {host['agent_dns']!r} (id={hid})")
        else:
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
    """Create a Zabbix Script if it doesn't exist yet, or update it if the command
    or execute_on changed — re-running this after editing playbook.py must actually
    fix a stale script, not leave an old command/execute_on silently in place."""
    existing = _rpc(
        session, "script.get",
        {"filter": {"name": [script["name"]]}, "output": ["scriptid", "command", "execute_on"]}, token,
    )
    if existing:
        sid = existing[0]["scriptid"]
        wanted_execute_on = str(script.get("execute_on", 0))
        changes = {}
        if existing[0]["command"] != script["command"]:
            changes["command"] = script["command"]
        if existing[0]["execute_on"] != wanted_execute_on:
            changes["execute_on"] = wanted_execute_on
        if changes:
            _rpc(session, "script.update", {"scriptid": sid, **changes}, token)
            print(f"  ↻ Updated script '{script['name']}' {list(changes)} (id={sid})")
        else:
            print(f"  · Script '{script['name']}' already exists (id={sid})")
        return sid

    params = {
        "name": script["name"],
        "command": script["command"],
        "type": 0,          # Script (shell)
        # 0 = Zabbix agent (runs directly on the target host — the normal
        # case now that each host's agent is co-located with its service);
        # 1 = Zabbix server (has docker.sock — only needed for db-server,
        # which still uses a separate agent container).
        "execute_on": script.get("execute_on", 0),
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

    # web-server, app-server and cache-server each run their service as a
    # backgrounded process under a `tail -f /dev/null` PID 1 (see
    # hosts/*/entrypoint.sh) so that stopping the service for a fault-injection
    # test — or because it crashed — doesn't take the whole container (and its
    # co-located Zabbix agent, sharing the container's PID namespace via
    # `pid: service:<name>`) down with it. That means the standard "Zabbix
    # agent is not available" trigger no longer fires when the service itself
    # dies — the agent's still there. proc.num[] items give us a real
    # process-level signal instead, the same way proc.mem[uvicorn] already
    # does for the memory-leak trigger below.

    web_hostid = host_ids["web-server"]
    web_host = _rpc(session, "host.get", {
        "hostids": [web_hostid],
        "output": ["hostid"],
        "selectInterfaces": ["interfaceid"],
    }, token)[0]
    web_interfaceid = web_host["interfaces"][0]["interfaceid"]

    ensure_item(
        session, token, "web-server", web_hostid, web_interfaceid,
        key="proc.num[nginx]",
        name="web-server nginx process count",
    )
    ensure_trigger(
        session, token,
        description="web-server nginx process is not running",
        expression="last(/web-server/proc.num[nginx])=0",
        priority=4,  # High
    )

    # /var/log/nginx isn't a separate volume (see docker-compose.yml), so it
    # lives on the container's root overlay filesystem, which Docker backs
    # with the *host's* real disk — vfs.fs.size[...,pused] there reports
    # usage of the whole host disk (e.g. 1TB), so dumping a 400MB fill.log
    # barely moves it (~2-3%) and can never cross a realistic 85% threshold.
    # vfs.dir.size[] instead sums the actual bytes under the log directory,
    # so it reflects the injected fault directly regardless of host disk size.
    ensure_item(
        session, token, "web-server", web_hostid, web_interfaceid,
        key="vfs.dir.size[/var/log/nginx]",
        name="web-server nginx log directory size",
    )
    ensure_trigger(
        session, token,
        description="web-server nginx log volume oversized (>300MB)",
        expression="last(/web-server/vfs.dir.size[/var/log/nginx])>300M",
        priority=3,  # Average
    )

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
    ensure_item(
        session, token, "app-server", app_hostid, app_interfaceid,
        key="proc.num[uvicorn]",
        name="app-server uvicorn process count",
    )
    ensure_trigger(
        session, token,
        description="app-server uvicorn process is not running",
        expression="last(/app-server/proc.num[uvicorn])=0",
        priority=4,  # High
    )

    cache_hostid = host_ids["cache-server"]
    cache_host = _rpc(session, "host.get", {
        "hostids": [cache_hostid],
        "output": ["hostid"],
        "selectInterfaces": ["interfaceid"],
    }, token)[0]
    cache_interfaceid = cache_host["interfaces"][0]["interfaceid"]

    ensure_item(
        session, token, "cache-server", cache_hostid, cache_interfaceid,
        key="proc.num[redis-server]",
        name="cache-server redis process count",
    )
    ensure_trigger(
        session, token,
        description="cache-server redis process is not running",
        expression="last(/cache-server/proc.num[redis-server])=0",
        priority=4,  # High
    )

    # evicted_keys (from `redis-cli INFO stats`) is a lifetime counter, not a
    # point-in-time gauge, so a last()-above-threshold trigger would fire once
    # during a storm and then never clear on its own. change() instead compares
    # consecutive polls, giving a proxy for eviction *rate* — which is exactly
    # what the cache-flush remediation script's description ("Redis eviction
    # rate is very high") and the cache-eviction-storm fault (scripts/inject.sh)
    # already assume exists.
    ensure_item(
        session, token, "cache-server", cache_hostid, cache_interfaceid,
        key="system.run[/usr/local/bin/check_evictions.sh]",
        name="cache-server redis evicted keys (cumulative)",
    )
    ensure_trigger(
        session, token,
        description="cache-server redis eviction rate high",
        expression="change(/cache-server/system.run[/usr/local/bin/check_evictions.sh])>50",
        priority=3,  # Average
    )

    worker_hostid = host_ids["worker-server"]
    worker_host = _rpc(session, "host.get", {
        "hostids": [worker_hostid],
        "output": ["hostid"],
        "selectInterfaces": ["interfaceid"],
    }, token)[0]
    worker_interfaceid = worker_host["interfaces"][0]["interfaceid"]

    # Unlike evicted_keys above, Celery's queue length (LLEN on the broker's
    # "celery" list key) is a point-in-time gauge, not a cumulative counter —
    # last()-above-threshold is the right comparison here, not change(). This
    # also sidesteps the flapping change() has: a gauge trigger stays in
    # PROBLEM for as long as the backlog persists (many poll cycles), instead
    # of firing for exactly one 30s window and auto-resolving before the
    # incident agent's own ~30s poll is guaranteed to catch it.
    #
    # NOTE: as of this writing, scripts/inject.sh|bat's "worker-queue-backup"
    # fault floods app-server's /slow HTTP endpoint — it never actually calls
    # worker.slow_task.delay(), so nothing lands in this Celery queue yet.
    # This item/trigger is real and will fire once something actually
    # publishes to the "celery" queue; the fault script needs a follow-up fix
    # to be a working end-to-end demo.
    ensure_item(
        session, token, "worker-server", worker_hostid, worker_interfaceid,
        key="system.run[/usr/local/bin/check_queue_depth.sh]",
        name="worker-server Celery queue depth (pending tasks)",
    )
    ensure_trigger(
        session, token,
        description="worker-server task queue depth high",
        expression="last(/worker-server/system.run[/usr/local/bin/check_queue_depth.sh])>=10",
        priority=3,  # Average
    )

    print("\n── Done ─────────────────────────────────────────")
    print("Script IDs (save these or let agent.py discover them at startup):")
    for name, sid in script_ids.items():
        print(f"  {name}: {sid}")


if __name__ == "__main__":
    main()
