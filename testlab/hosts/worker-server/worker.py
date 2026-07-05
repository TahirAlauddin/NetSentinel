"""
worker-server — Celery worker for testlab fault injection.

Deliberately slow tasks let us simulate queue-depth buildup.
The AI agent remediates by restarting the worker container.
"""

import os
import time

from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://cache-server:6379/0")

app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)
app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
)


@app.task(name="worker.slow_task")
def slow_task(delay: int = 5) -> str:
    """Sleeps for *delay* seconds — floods the queue when injected in bulk."""
    time.sleep(delay)
    return f"done after {delay}s"


@app.task(name="worker.fast_task")
def fast_task() -> str:
    return "ok"
