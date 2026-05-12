# Deployment Guide — data-plane

This document describes **staging** deployment on a server using **Docker Compose**. A dedicated production Compose stack is not defined; when introduced (for example `docker-compose.prod.yml`), the staging pattern should be replicated and recorded in this file.

**Local development** (direct install, dev Compose): [LOCAL_SETUP.md](LOCAL_SETUP.md).

**Image build and push to Docker Hub**: [DOCKER_HUB_DEPLOYMENT.md](DOCKER_HUB_DEPLOYMENT.md).

---

## Staging stack

`docker-compose.stag.yml` defines the following services:

| Service | Role |
|---------|------|
| **nginx** | Reverse proxy on ports 80 and 443; configuration under `nginx/conf.d.stag/` |
| **certbot** | Certificate renewal loop; Let’s Encrypt volumes shared with nginx |
| **postgres** | PostgreSQL 16; persistent data in the `postgres_data` volume |
| **backend** | Django + Gunicorn; environment from `data-plane/.env`; database host `postgres` |
| **frontend** | Next.js production image; build-time and runtime configuration from `data-plane/.env` |

---

## Prerequisites

- Docker Engine and Docker Compose v2 (`docker compose`)
- Host with ports **80** and **443** available; DNS pointing at the host for TLS where applicable
- Network access to clone the repository onto the target host

---

## Initial host configuration

1. Clone the repository and enter the data-plane directory:

   ```bash
   git clone <repository-url> NetSentinel
   cd NetSentinel/data-plane
   ```

2. Create `.env` at the **data-plane root** from the example (Compose `env_file: .env`):

   ```bash
   cp .env.example .env
   ```

3. Configure `.env` for staging. Minimum expectations:

   | Area | Notes |
   |------|--------|
   | **PostgreSQL** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — credentials must meet security policy. |
   | **Django** | `DJANGO_SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` — include the staging hostname and any internal hostnames required by settings (e.g. `backend`). |
   | **Frontend** | `NEXT_PUBLIC_API_URL` — public API base as exposed through nginx (e.g. `https://staging.example.com/api` when API is served under `/api`). `NEXTAUTH_URL` must match the browser-facing application URL. `NEXTAUTH_SECRET` — long, randomly generated value. |

   Compose injects **`SERVER_API_URL`** into the frontend image build (default `http://backend:8000/api/v1` for server-side requests). Override in `.env` only when the deployment layout differs.

4. **TLS:** Let’s Encrypt and nginx are integrated in `docker-compose.stag.yml`. Initial issuance, HTTP-only bootstrap, and cutover to HTTPS are documented under **SSL certificate** in [DOCKER_HUB_DEPLOYMENT.md](DOCKER_HUB_DEPLOYMENT.md); the same `docker-compose.stag.yml` command patterns apply.

---

## Deploy and update staging

Execute from `data-plane/`:

```bash
docker compose -f docker-compose.stag.yml up -d --build
```

- **`--build`** forces image rebuild after source or dependency changes. The staging file uses `build:` for backend and frontend, not pre-pulled registry images.
- Initial image builds may require several minutes.

### Migrations and static assets

Manual `migrate` / `collectstatic` steps are unnecessary for routine deployments. The backend entrypoint (`docker-entrypoint.sh`) waits for PostgreSQL, applies migrations, runs configured seed commands, runs `collectstatic`, then starts Gunicorn.

---

## Health verification

```bash
docker compose -f docker-compose.stag.yml ps
docker compose -f docker-compose.stag.yml logs -f backend
```

- Backend healthcheck: `GET http://localhost:8000/api/health/` inside the container.
- Frontend healthcheck: `GET /api/health` on port 3000 inside the container.

External checks use the URL served by nginx (e.g. `https://staging.example.com`).

---

## Stop and rollback

```bash
# Stop stack; retain volumes
docker compose -f docker-compose.stag.yml down

# Stop and remove volumes (destructive; removes PostgreSQL data)
docker compose -f docker-compose.stag.yml down -v
```

Application rollback: check out the prior Git revision on the host, then run `docker compose -f docker-compose.stag.yml up -d --build` again.

---

## Production (future)

When a production Compose file and environment exist:

- Isolate secrets and DNS names from staging.
- Maintain `DEBUG=False`; scope `ALLOWED_HOSTS`, CORS, and CSRF to production domains; align TLS with organizational policy.
- Record the compose filename (e.g. `docker-compose.prod.yml`) and any behavioral differences from staging in this section.
