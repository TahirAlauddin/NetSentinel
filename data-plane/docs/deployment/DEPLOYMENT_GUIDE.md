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

4. **TLS:** Let’s Encrypt and nginx are integrated in `docker-compose.stag.yml`. For initial issuance, HTTP-only bootstrap, and cutover to HTTPS, see **SSL certificate (Let's Encrypt)** below.

---

## SSL certificate (Let's Encrypt)

On a fresh VM (or after certificate expiry), use HTTP first, then obtain the cert and switch to HTTPS.

### 1. Use HTTP-only config (staging only)

When using `docker-compose.stag.yml`, ensure `nginx/conf.d.stag/site.conf` includes the HTTP config (default):

```nginx
include /etc/nginx/conf.d/includes/netsentinel-http.conf;
```

### 2. Start the stack and obtain the certificate

From the `data-plane` directory (Linux/WSL):

```bash
cd data-plane
chmod +x scripts/obtain-ssl-cert.sh
./scripts/obtain-ssl-cert.sh YOUR_EMAIL YOUR_DOMAIN
```

Example:

```bash
./scripts/obtain-ssl-cert.sh admin@example.com staging.netsentinel.io
```

Prerequisites: your domain must point to this server (A record), and ports 80 (and 443 because you're gonna switch to HTTPS later) must be open.

### 3. Switch nginx to HTTPS

- Edit `nginx/conf.d.stag/site.conf` and set:
  ```nginx
  include /etc/nginx/conf.d/includes/netsentinel-ssl.conf;
  ```
- Edit `nginx/conf.d.stag/includes/netsentinel-ssl.conf` and replace every `YOUR_DOMAIN` with your actual domain (e.g. `staging.netsentinel.io`).

### 4. Reload nginx

```bash
docker compose -f docker-compose.stag.yml exec nginx nginx -t
docker compose -f docker-compose.stag.yml exec nginx nginx -s reload
```

To switch back to HTTP-only (e.g. no cert), set `nginx/conf.d.stag/site.conf` back to `netsentinel-http.conf` and reload nginx.

---

## Deploy and update staging

Execute from `data-plane/`:

```bash
docker compose -f docker-compose.stag.yml up -d --build
```

- **`--build`** forces image rebuild after source or dependency changes. The staging file uses `build:` for backend and frontend, not pre-pulled registry images.
- Initial image builds may require several minutes.

### Migrations and static assets

The backend entrypoint (`docker-entrypoint.sh`) waits for PostgreSQL, applies migrations, runs configured seed commands, runs `collectstatic`, then starts Gunicorn.

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


---

## Troubleshooting
