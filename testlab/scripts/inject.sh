#!/usr/bin/env bash
# scripts/inject.sh — Fault injection for the NetSentinel testlab
#
# Usage:  ./scripts/inject.sh <fault_name>
#
# Run from the testlab/ root so Docker container names resolve correctly.
# Each fault is designed to trigger a specific Zabbix alert, which the
# AI agent will then detect and attempt to remediate automatically.

set -euo pipefail

FAULT=${1:-""}

case $FAULT in

  # ── web-server ──────────────────────────────────────────────────────────────

  web-down)
    echo "[FAULT] Stopping the nginx process (container stays up) → triggers 'web-server process down' alert"
    docker exec host-web-server nginx -s stop
    echo "  Expected AI action : web-restart-nginx"
    echo "  Manual resolve     : docker exec host-web-server nginx"
    ;;

  web-disk-full)
    echo "[FAULT] Filling nginx log disk → triggers 'disk usage >85%' alert"
    docker exec host-web-server sh -c "dd if=/dev/zero of=/var/log/nginx/fill.log bs=1M count=400 status=progress"
    echo "  Expected AI action : web-clear-disk"
    echo "  Manual resolve     : docker exec host-web-server rm /var/log/nginx/fill.log"
    ;;

  # ── app-server ──────────────────────────────────────────────────────────────

  app-memory-leak)
    echo "[FAULT] Triggering memory leak on app-server → triggers 'memory >80%' alert"
    echo "  Firing /leak?mb=10 forty times concurrently …"
    for i in $(seq 1 40); do
      curl -sf "http://localhost:8000/leak?mb=10" > /dev/null &
    done
    wait
    echo "  Expected AI action : app-restart"
    echo "  Manual resolve     : docker exec host-app-server systemctl restart uvicorn"
    ;;

  app-cpu-spike)
    echo "[FAULT] CPU spike on app-server for 120s → triggers 'CPU >90%' alert"
    curl -sf "http://localhost:8000/cpu-spike?seconds=120" &
    echo "  Expected AI action : app-restart"
    echo "  Manual resolve     : docker exec host-app-server systemctl restart uvicorn"
    ;;

  app-crash-loop)
    echo "[FAULT] Stopping the uvicorn service (container stays up) → triggers 'process down' alert"
    docker exec host-app-server systemctl stop uvicorn
    echo "  Expected AI action : app-restart"
    echo "  Manual resolve     : docker exec host-app-server systemctl start uvicorn"
    ;;

  # ── db-server ───────────────────────────────────────────────────────────────

  db-connection-exhaustion)
    echo "[FAULT] Opening 17 idle connections → exhausts DB pool (max_connections=20)"
    for i in $(seq 1 17); do
      docker exec host-db-server psql -U postgres -d appdb -c "SELECT pg_sleep(300)" &
    done
    echo "  Expected AI action : db-kill-idle-connections"
    echo "  Manual resolve     : docker exec host-db-server pkill -f 'pg_sleep'"
    ;;

  db-long-query)
    echo "[FAULT] Running a 60-second query → triggers 'slow query >500ms' alert"
    docker exec host-db-server psql -U postgres -d appdb -c "SELECT pg_sleep(60)" &
    echo "  Expected AI action : db-cancel-long-queries"
    echo "  Manual resolve     : docker exec host-db-server psql -U postgres -c 'SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE query LIKE \"%pg_sleep%\"'"
    ;;

  # ── cache-server ─────────────────────────────────────────────────────────────

  cache-eviction-storm)
    echo "[FAULT] Flooding Redis past maxmemory → triggers eviction rate alert"
    docker exec host-cache-server redis-cli eval "
      for i=1,10000 do
        redis.call('SET', 'key:'..i, string.rep('x', 10000), 'EX', 300)
      end
      return 'done'
    " 0
    echo "  Expected AI action : cache-flush"
    echo "  Manual resolve     : docker exec host-cache-server redis-cli FLUSHDB"
    ;;

  cache-down)
    echo "[FAULT] Stopping the redis-server process (container stays up) → triggers cache-server process-down + worker queue backup"
    # SHUTDOWN closes the connection without replying, so redis-cli can exit
    # non-zero even on success — don't let `set -e` treat that as a failure.
    docker exec host-cache-server redis-cli SHUTDOWN NOSAVE || true
    echo "  Expected AI action : cache-restart"
    echo "  Manual resolve     : docker exec host-cache-server systemctl start redis-server"
    ;;

  # ── worker-server ────────────────────────────────────────────────────────────

  worker-queue-backup)
    echo "[FAULT] Flooding task queue with slow tasks → triggers queue depth alert"
    curl -sf "http://localhost:8000/slow?delay=60" &
    for i in $(seq 1 50); do
      curl -sf "http://localhost:8000/slow?delay=30" &
    done
    echo "  Expected AI action : worker-restart"
    echo "  Manual resolve     : docker exec host-worker-server systemctl restart celery-worker"
    ;;

  # ── help ─────────────────────────────────────────────────────────────────────

  *)
    echo ""
    echo "Usage: $0 <fault>"
    echo ""
    echo "Available faults:"
    echo ""
    echo "  web-server"
    echo "    web-down              Stop nginx (process-down alert)"
    echo "    web-disk-full         Fill log disk with 400 MB (disk alert)"
    echo ""
    echo "  app-server"
    echo "    app-memory-leak       Leak 400 MB of RAM gradually (memory alert)"
    echo "    app-cpu-spike         Peg all CPUs for 120s (CPU alert)"
    echo "    app-crash-loop        Kill container (process-down alert)"
    echo ""
    echo "  db-server"
    echo "    db-connection-exhaustion  Open 17 idle connections (connection alert)"
    echo "    db-long-query             Run a 60-second query (slow query alert)"
    echo ""
    echo "  cache-server"
    echo "    cache-eviction-storm  Flood Redis past maxmemory (eviction alert)"
    echo "    cache-down            Stop Redis (unreachable alert)"
    echo ""
    echo "  worker-server"
    echo "    worker-queue-backup   Flood task queue with slow tasks (queue depth alert)"
    echo ""
    exit 1
    ;;
esac
