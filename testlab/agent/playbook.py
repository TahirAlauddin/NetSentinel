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
command     : the shell command that Zabbix server runs (Docker CLI)
              executed on the Zabbix *server* which has /var/run/docker.sock
"""

from __future__ import annotations

SCRIPTS: list[dict] = [
    # ── web-server ──────────────────────────────────────────────────────────
    {
        "name": "web-restart-nginx",
        "host": "web-server",
        "description": (
            "Restart the nginx container. "
            "Use when nginx process is down, not responding, or returning 5xx errors."
        ),
        "command": "docker restart host-web-server",
    },
    {
        "name": "web-clear-disk",
        "host": "web-server",
        "description": (
            "Delete oversized log files that are filling the nginx log volume. "
            "Use when disk usage on web-server is above 85%."
        ),
        "command": "docker exec host-web-server sh -c 'rm -f /var/log/nginx/fill.log && df -h /var/log/nginx'",
    },
    {
        "name": "web-reload-nginx",
        "host": "web-server",
        "description": (
            "Send SIGHUP to nginx to gracefully reload config without dropping connections. "
            "Use for minor config issues or when a restart would be too disruptive."
        ),
        "command": "docker exec host-web-server nginx -s reload",
    },

    # ── app-server ──────────────────────────────────────────────────────────
    {
        "name": "app-restart",
        "host": "app-server",
        "description": (
            "Restart the FastAPI app container. "
            "Use when the process has crashed, is OOM-killed, or memory usage exceeds 85%."
        ),
        "command": "docker restart host-app-server",
    },

    # ── db-server ───────────────────────────────────────────────────────────
    {
        "name": "db-kill-idle-connections",
        "host": "db-server",
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
        "command": "docker exec host-cache-server redis-cli FLUSHDB",
    },
    {
        "name": "cache-restart",
        "host": "cache-server",
        "description": (
            "Restart the Redis container. "
            "Use when Redis is completely unreachable or the worker queue is backed up due to cache being down."
        ),
        "command": "docker restart host-cache-server",
    },

    # ── worker-server ────────────────────────────────────────────────────────
    {
        "name": "worker-restart",
        "host": "worker-server",
        "description": (
            "Restart the Celery worker container. "
            "Use when the worker process has crashed, is stuck, or the task queue depth is excessive."
        ),
        "command": "docker restart host-worker-server",
    },
]


def scripts_for_host(hostname: str) -> list[dict]:
    """Return scripts applicable to *hostname*."""
    return [s for s in SCRIPTS if s["host"] == hostname]


def script_by_name(name: str) -> dict | None:
    """Look up a script by its exact name."""
    return next((s for s in SCRIPTS if s["name"] == name), None)
