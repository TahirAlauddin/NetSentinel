# NetSentinel — AI Remediation Testlab

A self-contained Docker Compose lab for testing the **Agentic AI remediation** feature locally before wiring it up to a real Zabbix instance.

The agent monitors Zabbix for active problems, asks an LLM which remediation script to run, and executes it via `script.execute` — all automatically.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  testlab/                                                       │
│                                                                 │
│  ┌─ Zabbix Stack ──────────┐   ┌─ Simulated Hosts ───────────┐ │
│  │  zabbix-db (Postgres)   │   │  host-web-server  (nginx)   │ │
│  │  zabbix-server          │   │  host-app-server  (FastAPI) │ │
│  │  zabbix-web  :8090      │   │  host-db-server   (Postgres)│ │
│  └─────────────────────────┘   │  host-cache-server(Redis)   │ │
│                                │  host-worker-server(Celery) │ │
│  ┌─ AI Agent ──────────────┐   └─────────────────────────────┘ │
│  │  agent/agent.py         │                                    │
│  │    poll problem.get     │──── script.execute ───────────────▶│
│  │    ask LLM              │                                    │
│  │    run remediation      │   Each host has a Zabbix Agent 2   │
│  └─────────────────────────┘   container reporting metrics      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quickstart

### 1. Start the stack

```bash
cd testlab
docker compose up -d --build
```

Wait ~60 seconds for Zabbix to initialise. Open **http://localhost:8090** (admin / zabbix).

### 2. Bootstrap Zabbix (one-time)

```bash
cd agent
pip install -r requirements.txt
python setup_zabbix.py
```

This creates:
- A **TestLab Hosts** host group
- One Zabbix host per container (web-server, app-server, …)
- One Zabbix **Script** per entry in `playbook.py` (the remediation actions)

### 3. Configure the agent

```bash
cp .env.example .env
# Edit .env — set OPENAI_API_KEY at minimum
```

### 4. Run the agent

```bash
cd agent
python agent.py
```

The agent polls Zabbix every 30 seconds. When it finds a new problem it prints its reasoning and executes the chosen script.

### 5. Inject a fault

Open a second terminal from `testlab/`:

```bash
bash scripts/inject.sh web-disk-full
```

Watch the agent terminal — within the next poll interval it will detect the alert, pick `web-clear-disk`, and run it.

---

## Fault Scenarios

| Command | Host | What it does | Expected AI action |
|---|---|---|---|
| `web-down` | web-server | Stop the nginx process (container stays up) | `web-restart-nginx` |
| `web-disk-full` | web-server | Fill log disk with 400 MB | `web-clear-disk` |
| `app-memory-leak` | app-server | Leak 400 MB of RAM | `app-restart` |
| `app-cpu-spike` | app-server | Peg all CPUs for 120 s | `app-restart` |
| `app-crash-loop` | app-server | Kill the uvicorn process (container stays up) | `app-restart` |
| `db-connection-exhaustion` | db-server | Open 17 idle connections | `db-kill-idle-connections` |
| `db-long-query` | db-server | Run a 60-second query | `db-cancel-long-queries` |
| `cache-eviction-storm` | cache-server | Flood Redis past maxmemory | `cache-flush` |
| `cache-down` | cache-server | Stop the redis-server process (container stays up) | `cache-restart` |
| `worker-queue-backup` | worker-server | Flood task queue | `worker-restart` |

Each simulated host's container is meant to model a real physical machine: it must stay running no matter what, the same way a real host survives one of its services crashing. `web-down`, `app-crash-loop`, and `cache-down` stop only the service *process* inside the container (see each host's `entrypoint.sh`, which backgrounds the real service under a `tail -f /dev/null` PID 1) — never the container itself. That matters because each host's Zabbix agent runs in its own sidecar container sharing that host's PID namespace (`pid: service:<name>` in docker-compose.yml); stopping the whole container would take the agent down with it, which isn't how a real host/agent relationship behaves and would mask what the AI agent is actually being tested on.

---

## Directory Layout

```
testlab/
├── docker-compose.yml          Full lab stack
├── .env.example                Environment variable template
│
├── hosts/                      One folder per simulated host
│   ├── web-server/
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh       Backgrounds nginx, keeps container up if it dies
│   │   ├── nginx.conf
│   │   ├── html/index.html
│   │   └── zabbix_agent.conf
│   ├── app-server/
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh       Backgrounds uvicorn, keeps container up if it dies
│   │   ├── start-app.sh / stop-app.sh
│   │   └── main.py             FastAPI with leak/cpu/crash endpoints
│   ├── db-server/
│   │   └── init.sql
│   ├── cache-server/
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh       Backgrounds redis-server, keeps container up if it dies
│   │   └── start-redis.sh
│   └── worker-server/
│       ├── Dockerfile
│       └── worker.py           Celery worker
│
├── agent/                      AI remediation agent
│   ├── agent.py                Main loop: poll → LLM → script.execute
│   ├── playbook.py             Script registry (name, description, command)
│   ├── setup_zabbix.py         One-time Zabbix bootstrap via API
│   └── requirements.txt
│
└── scripts/
    └── inject.sh               Fault injection CLI
```

---

## How the agent works

1. **Poll** — calls `problem.get` (severity ≥ Warning) every `POLL_INTERVAL` seconds.
2. **Enrich** — fetches trigger name, comments, and affected host for each new problem.
3. **Decide** — sends a structured prompt to the LLM listing all available scripts for that host. The LLM returns `{ chosen_script, reasoning, confidence }` as JSON.
4. **Execute** — calls `script.execute` with the chosen `scriptid` and `hostid`. The script runs on the Zabbix server (which has Docker socket access) and performs the Docker remediation command.
5. **Log** — prints trigger name, chosen script, LLM reasoning, and the script output.

Problems are tracked in memory so each event is only acted on once. Restart the agent to re-process resolved and reopened problems.

---

## DRY_RUN mode

Set `DRY_RUN=1` in `.env` to run the agent without calling `script.execute`. Useful for evaluating LLM decisions before allowing real remediation.

---

## Extending the playbook

Add a new entry to `agent/playbook.py`:

```python
{
    "name": "my-new-action",
    "host": "app-server",
    "description": "Describe what this does in plain English for the LLM.",
    "command": "docker exec host-app-server some-command",
},
```

Then re-run `setup_zabbix.py` to register it in Zabbix. The agent picks it up on next start.
