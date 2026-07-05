@echo off
:: scripts/inject.bat — Fault injection for the NetSentinel testlab
::
:: Usage:  scripts\inject.bat <fault_name>
::
:: Run from the testlab\ root so Docker container names resolve correctly.
:: Each fault is designed to trigger a specific Zabbix alert, which the
:: AI agent will then detect and attempt to remediate automatically.

setlocal enabledelayedexpansion

set FAULT=%~1

if "%FAULT%"=="" goto help

:: ── web-server ──────────────────────────────────────────────────────────────

if "%FAULT%"=="web-down" (
    echo [FAULT] Stopping nginx ^→ triggers 'web-server process down' alert
    docker stop host-web-server
    echo   Expected AI action : web-restart-nginx
    echo   Manual resolve     : docker start host-web-server
    goto end
)

if "%FAULT%"=="web-disk-full" (
    echo [FAULT] Filling nginx log disk ^→ triggers 'disk usage ^>85%%' alert
    docker exec host-web-server sh -c "dd if=/dev/zero of=/var/log/nginx/fill.log bs=1M count=400 status=progress"
    echo   Expected AI action : web-clear-disk
    echo   Manual resolve     : docker exec host-web-server rm /var/log/nginx/fill.log
    goto end
)

:: ── app-server ──────────────────────────────────────────────────────────────

if "%FAULT%"=="app-memory-leak" (
    echo [FAULT] Triggering memory leak on app-server ^→ triggers 'memory ^>80%%' alert
    echo   Calling /leak?mb=10 forty times ...
    for /l %%i in (1,1,40) do (
        curl -sf "http://localhost:8000/leak?mb=10" > nul
        timeout /t 1 /nobreak > nul
    )
    echo   Expected AI action : app-restart
    echo   Manual resolve     : docker restart host-app-server
    goto end
)

if "%FAULT%"=="app-cpu-spike" (
    echo [FAULT] CPU spike on app-server for 120s ^→ triggers 'CPU ^>90%%' alert
    start /b curl -sf "http://localhost:8000/cpu-spike?seconds=120"
    echo   Expected AI action : app-restart
    echo   Manual resolve     : docker restart host-app-server
    goto end
)

if "%FAULT%"=="app-crash-loop" (
    echo [FAULT] Crashing app-server process ^→ triggers 'process down' alert
    curl -sf "http://localhost:8000/crash"
    echo   Expected AI action : app-restart
    goto end
)

:: ── db-server ───────────────────────────────────────────────────────────────

if "%FAULT%"=="db-connection-exhaustion" (
    echo [FAULT] Opening 17 idle connections ^→ exhausts DB pool ^(max_connections=20^)
    for /l %%i in (1,1,17) do (
        start /b docker exec host-db-server psql -U postgres -d appdb -c "SELECT pg_sleep(300)"
    )
    echo   Expected AI action : db-kill-idle-connections
    echo   Manual resolve     : docker exec host-db-server pkill -f "pg_sleep"
    goto end
)

if "%FAULT%"=="db-long-query" (
    echo [FAULT] Running a 60-second query ^→ triggers 'slow query ^>500ms' alert
    start /b docker exec host-db-server psql -U postgres -d appdb -c "SELECT pg_sleep(60)"
    echo   Expected AI action : db-cancel-long-queries
    echo   Manual resolve     : docker exec host-db-server psql -U postgres -c "SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE query LIKE '%%pg_sleep%%'"
    goto end
)

:: ── cache-server ─────────────────────────────────────────────────────────────

if "%FAULT%"=="cache-eviction-storm" (
    echo [FAULT] Flooding Redis past maxmemory ^→ triggers eviction rate alert
    docker exec host-cache-server redis-cli eval "for i=1,10000 do redis.call('SET', 'key:'..i, string.rep('x', 10000), 'EX', 300) end return 'done'" 0
    echo   Expected AI action : cache-flush
    echo   Manual resolve     : docker exec host-cache-server redis-cli FLUSHDB
    goto end
)

if "%FAULT%"=="cache-down" (
    echo [FAULT] Stopping Redis ^→ triggers cache-server unreachable + worker queue backup
    docker stop host-cache-server
    echo   Expected AI action : cache-restart
    echo   Manual resolve     : docker start host-cache-server
    goto end
)

:: ── worker-server ────────────────────────────────────────────────────────────

if "%FAULT%"=="worker-queue-backup" (
    echo [FAULT] Flooding task queue with slow tasks ^→ triggers queue depth alert
    start /b curl -sf "http://localhost:8000/slow?delay=60"
    for /l %%i in (1,1,50) do (
        start /b curl -sf "http://localhost:8000/slow?delay=30"
    )
    echo   Expected AI action : worker-restart
    echo   Manual resolve     : docker restart host-worker-server
    goto end
)

:: ── help ─────────────────────────────────────────────────────────────────────

:help
echo.
echo Usage: %~nx0 ^<fault^>
echo.
echo Available faults:
echo.
echo   web-server
echo     web-down              Stop nginx (process-down alert)
echo     web-disk-full         Fill log disk with 400 MB (disk alert)
echo.
echo   app-server
echo     app-memory-leak       Leak 400 MB of RAM gradually (memory alert)
echo     app-cpu-spike         Peg all CPUs for 120s (CPU alert)
echo     app-crash-loop        Kill uvicorn (process-down alert)
echo.
echo   db-server
echo     db-connection-exhaustion  Open 17 idle connections (connection alert)
echo     db-long-query             Run a 60-second query (slow query alert)
echo.
echo   cache-server
echo     cache-eviction-storm  Flood Redis past maxmemory (eviction alert)
echo     cache-down            Stop Redis (unreachable alert)
echo.
echo   worker-server
echo     worker-queue-backup   Flood task queue with slow tasks (queue depth alert)
echo.
exit /b 1

:end
endlocal
