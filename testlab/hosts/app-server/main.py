"""
app-server — intentionally broken FastAPI app for testlab fault injection.

Endpoints:
  GET /              healthy check
  GET /leak          grows memory by ?mb=N each call  → triggers high-memory alert
  GET /cpu-spike     pegs all cores for ?seconds=N    → triggers high-CPU alert
  GET /crash         kills the process                → triggers process-down alert
  GET /slow          blocks for ?delay=N seconds      → triggers response-time alert
                     and worker-server queue-depth alert (see /slow docstring)
"""

import os
import threading
import time

from celery import Celery
from fastapi import FastAPI

app = FastAPI(title="app-server", description="Fault-injection target for NetSentinel testlab")

REDIS_URL = os.getenv("REDIS_URL", "redis://cache-server:6379/0")
celery_client = Celery("app-server-client", broker=REDIS_URL, backend=REDIS_URL)

_leak: list[bytes] = []


@app.get("/")
def healthy():
    return {"status": "ok", "leak_chunks": len(_leak)}


@app.get("/leak")
def memory_leak(mb: int = 10):
    """Appends a byte buffer — call repeatedly to grow resident memory."""
    _leak.append(b"x" * (mb * 1024 * 1024))
    return {"leaked_mb": mb, "total_chunks": len(_leak), "approx_total_mb": len(_leak) * mb}
 

@app.get("/cpu-spike")
def cpu_spike(seconds: int = 30):
    """Spawns a busy-loop thread per CPU core for *seconds*."""
    def burn():
        end = time.monotonic() + seconds
        while time.monotonic() < end:
            pass

    for _ in range(os.cpu_count() or 1):
        threading.Thread(target=burn, daemon=True).start()
    return {"burning_seconds": seconds, "threads": os.cpu_count()}


@app.get("/crash")
def crash():
    """Hard-exits the process — Zabbix agent detects the disappearance."""
    os._exit(1)


@app.get("/slow")
def slow_response(delay: int = 10):
    """Dispatches worker.slow_task to worker-server over Celery/Redis and blocks on the
    result — holds the connection open (contributes to connection-count and response-time
    alerts) while also piling *delay*-second tasks onto worker-server's queue faster than
    its 2 worker processes can drain them (contributes to queue-depth alert)."""
    result = celery_client.send_task("worker.slow_task", args=[delay])
    result.get(timeout=delay + 30)
    return {"slept": delay}
