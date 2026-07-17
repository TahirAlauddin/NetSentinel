"""
Remediation playbook for the NetSentinel testlab AI agent.

Each entry describes one Zabbix "Script" that the agent may execute.
The AI is given the descriptions as context and picks the best one for
the active problem.

Fields
------
name        : unique script name (must match what's registered in Zabbix)
host        : which testlab host this applies to (matches ZBX_HOSTNAME)
description : plain-English explanation the AI uses to choose this script
command     : the shell command that runs the fix
execute_on  : 0 (default) = Zabbix agent — runs directly on the target host,
              via its co-located agent, same as it would on a real machine.
              1 = Zabbix server, which reaches a host only via `docker exec
              host-<name> ...` (it has docker.sock, not a shell on the host
              itself) — only needed for db-server, which still runs its
              Zabbix agent in a separate sidecar container rather than
              co-located with the service.
"""

from __future__ import annotations

SCRIPTS: list[dict] = [
    # ── web-server ──────────────────────────────────────────────────────────
    {
        "name": "web-restart-nginx",
        "host": "web-server",
        "description": (
            "Restart the nginx service. nginx runs as a systemd service on this "
            "host (see hosts/web-server/nginx.service) — the container itself stays "
            "up regardless. Use when nginx process is down, not responding, or "
            "returning 5xx errors."
        ),
        "command": "systemctl restart nginx",
    },
    {
        "name": "web-clear-disk",
        "host": "web-server",
        "description": (
            "Delete oversized log files that are filling the nginx log volume. "
            "Use when disk usage on web-server is above 85%."
        ),
        "command": "rm -f /var/log/nginx/fill.log && df -h /var/log/nginx",
    },
    {
        "name": "web-reload-nginx",
        "host": "web-server",
        "description": (
            "Reload nginx config without dropping connections. "
            "Use for minor config issues or when a restart would be too disruptive."
        ),
        "command": "systemctl reload nginx",
    },

    # ── app-server ──────────────────────────────────────────────────────────
    {
        "name": "app-restart",
        "host": "app-server",
        "description": (
            "Restart the uvicorn service. uvicorn runs as a systemd service on this "
            "host (see hosts/app-server/uvicorn.service) — the container itself "
            "stays up regardless. Use when the process has crashed, is OOM-killed, "
            "or memory usage exceeds 85%."
        ),
        "command": "systemctl restart uvicorn",
    },

    # ── db-server ───────────────────────────────────────────────────────────
    # db-server keeps a separate Zabbix agent sidecar (see docker-compose.yml)
    # rather than co-locating one in the postgres:16-alpine image, so its
    # scripts still run on the Zabbix server via docker exec.
    {
        "name": "db-kill-idle-connections",
        "host": "db-server",
        "execute_on": 1,
        "description": (
            "Terminate all idle PostgreSQL connections to free up the connection pool. "
            "Use when active connection count approaches max_connections (20 in testlab)."
        ),
        "command": (
            "docker exec host-db-server psql -U postgres -d appdb -c "
            "\"SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            "WHERE pid <> pg_backend_pid() "
            "AND (state = 'idle' OR query ILIKE '%pg_sleep%');\""
        ),
    },
    {
        "name": "db-cancel-long-queries",
        "host": "db-server",
        "execute_on": 1,
        "description": (
            "Cancel any query running longer than 30 seconds. "
            "Use when Zabbix reports slow queries or pg_stat_activity shows stuck sessions."
        ),
        "command": (
            "docker exec host-db-server psql -U postgres -d appdb -c "
            "\"SELECT pg_cancel_backend(pid) FROM pg_stat_activity "
            "WHERE state = 'active' "
            "AND query_start < NOW() - INTERVAL '30 seconds' "
            "AND pid <> pg_backend_pid();\""
        ),
    },
    {
        "name": "db-restart",
        "host": "db-server",
        "execute_on": 1,
        "description": (
            "Restart the PostgreSQL container as a last resort. "
            "Use only when the server is completely unresponsive."
        ),
        "command": "docker restart host-db-server",
    },

    # ── cache-server ─────────────────────────────────────────────────────────
    {
        "name": "cache-flush",
        "host": "cache-server",
        "description": (
            "Flush the Redis database (FLUSHDB) to clear memory pressure. "
            "Use when Redis eviction rate is very high or maxmemory is reached."
        ),
        "command": "redis-cli FLUSHDB",
    },
    {
        "name": "cache-restart",
        "host": "cache-server",
        "description": (
            "Restart the redis-server service. redis-server runs as a systemd "
            "service on this host (see hosts/cache-server/redis-server.service) — "
            "the container itself stays up regardless. Use when Redis is "
            "completely unreachable or the worker queue is backed up due to cache "
            "being down."
        ),
        "command": "systemctl restart redis-server",
    },

    # ── worker-server ────────────────────────────────────────────────────────
    {
        "name": "worker-restart",
        "host": "worker-server",
        "description": (
            "Restart the Celery worker service. It runs as a systemd service on "
            "this host (see hosts/worker-server/celery-worker.service) — the "
            "container itself stays up regardless. Use when the worker process "
            "has crashed, is stuck, or the task queue depth is excessive."
        ),
        "command": "systemctl restart celery-worker",
    },
]


def scripts_for_host(hostname: str) -> list[dict]:
    """Return scripts applicable to *hostname*."""
    return [s for s in SCRIPTS if s["host"] == hostname]


def script_by_name(name: str) -> dict | None:
    """Look up a script by its exact name."""
    return next((s for s in SCRIPTS if s["name"] == name), None)
