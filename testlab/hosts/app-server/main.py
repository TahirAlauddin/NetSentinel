"""
app-server — intentionally broken FastAPI app for testlab fault injection.

Endpoints:
  GET /              healthy check
  GET /leak          grows memory by ?mb=N each call  → triggers high-memory alert
  GET /cpu-spike     pegs all cores for ?seconds=N    → triggers high-CPU alert
  GET /crash         kills the process                → triggers process-down alert
  GET /slow          blocks for ?delay=N seconds      → triggers response-time alert
"""

import os
import threading
import time

from fastapi import FastAPI

app = FastAPI(title="app-server", description="Fault-injection target for NetSentinel testlab")

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
    """Holds the connection open — contributes to connection-count and response-time alerts."""
    time.sleep(delay)
    return {"slept": delay}
