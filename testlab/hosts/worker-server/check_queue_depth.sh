#!/bin/sh
# Prints the number of pending tasks in Celery's default "celery" queue on Redis.
# Run by the Zabbix agent (system.run[]) using the worker's own venv, which
# already has the `redis` package (see Dockerfile: `pip install celery redis`).
/app/venv/bin/python3 -c "
import redis
r = redis.Redis(host='cache-server', port=6379, db=0)
print(r.llen('celery'))
"
