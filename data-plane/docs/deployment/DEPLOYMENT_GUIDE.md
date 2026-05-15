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

   Note: Cloning the repository requires SSH access to the repository. If deploying on a fresh VM, that doesn't already have cloning permissions. Use the following steps to generate an SSH key and add it to your GitHub repository:
   1. Generate an SSH key on the VM: `ssh-keygen -t ed25519 -C "your_email@example.com"`
   2. Copy the public key: `cat ~/.ssh/id_ed25519.pub`
   3. Add the public key to the repository: Goto the repository settings, go to the "Deploy Keys" section, and click "Add Deploy Key". Paste the public key into the "Key" field and click "Add Key". 


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

### 5. Renewing the certificate

The **certbot** service renews automatically every 12 hours while the stack is up. Keep DNS pointed at this host and port **80** open for the HTTP-01 challenge (`netsentinel-ssl.conf` already serves `/.well-known/acme-challenge/`).

Reload nginx after renewal so it picks up the new cert:

```bash
docker compose -f docker-compose.stag.yml exec nginx nginx -s reload
```

Check expiry, test, or renew manually:

```bash
docker compose -f docker-compose.stag.yml exec certbot certbot certificates
docker compose -f docker-compose.stag.yml exec certbot certbot renew --dry-run
docker compose -f docker-compose.stag.yml exec certbot certbot renew
docker compose -f docker-compose.stag.yml exec nginx nginx -s reload
```

If the cert has already expired, re-run `./scripts/obtain-ssl-cert.sh` (steps 2–4 above).

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

### Useful commands

Run these from `data-plane/` unless noted otherwise.

| Goal | Command |
|------|---------|
| Service state and exit codes | `docker compose -f docker-compose.stag.yml ps -a` |
| Follow logs (all services) | `docker compose -f docker-compose.stag.yml logs -f --tail=200` |
| Follow logs (one service) | `docker compose -f docker-compose.stag.yml logs -f backend` (swap `backend` for `frontend`, `nginx`, `postgres`, `certbot`) |
| Validate nginx config inside the container | `docker compose -f docker-compose.stag.yml exec nginx nginx -t` |
| To get inside a container | `docker compose -f docker-compose.stag.yml exec backend sh` |
| Inspect env and mounts | `docker compose -f docker-compose.stag.yml config` and `docker inspect netsentinel-backend` |
| Recreate one service after `.env` changes | `docker compose -f docker-compose.stag.yml up -d --no-deps --force-recreate backend` (swap service name as needed) |

After editing nginx files on the host, reload only if `nginx -t` succeeds:

```bash
docker compose -f docker-compose.stag.yml exec nginx nginx -t && \
  docker compose -f docker-compose.stag.yml exec nginx nginx -s reload
```

### Common issues

**`docker compose` fails with “port is already allocated” (80 or 443)**  
Another process or stack is bound to that port. On Linux, `sudo ss -tlnp | grep -E ':80|:443'` shows the listener. Stop the conflicting service.

**Containers show `unhealthy` or keep restarting**  
Inspect logs for the failing service.

- **Backend** (common): `FATAL: password authentication failed` or similar when `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` in `.env` no longer match the cluster inside the persistent `postgres_data` volume. Compose only applies those variables on **first** database init; afterward the volume keeps the old roles and passwords. The **Postgres** service often still reports **healthy** because its healthcheck uses `pg_isready` (no app password check), while the backend keeps failing and may be marked unhealthy. Fix: put the Postgres-related vars back to what was used at first boot, or remove the volume and re-create the stack (**data loss** on that host). Also check migrations, missing Django env vars, and tracebacks near the top of backend logs.

- **Frontend**: build failures, missing env at build/runtime, or startup errors in the first log lines.

**Browser or TLS works, but nothing from the public internet (or Let’s Encrypt fails)**  
Host or cloud **firewall / security group** must allow inbound **TCP 80** and **TCP 443** to this machine. On Ubuntu, `sudo ufw status` shows whether `80/tcp` and `443/tcp` are allowed.

**Site loads but API calls fail, or browser shows CORS / CSRF errors**  
Confirm `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` include the **public** hostname and scheme (e.g. `https://staging.example.com`) as the browser uses them. `NEXT_PUBLIC_API_URL` must match how nginx exposes the API (path and origin).

**502 / 504 from nginx**  
Usually means nginx cannot reach `backend` or `frontend`. Check both are running: `docker compose -f docker-compose.stag.yml ps`. Check upstream errors: `docker compose -f docker-compose.stag.yml logs nginx backend frontend`.

**Let’s Encrypt / `obtain-ssl-cert.sh` fails**  
DNS for the domain must resolve to this host before ACME runs. Port **80** must reach this machine (no CDN or proxy blocking the HTTP-01 challenge unless you use DNS validation instead). Firewalls and security groups must allow inbound HTTP from the internet for issuance.

**`nginx -t` fails after enabling HTTPS**  
Typo in `server_name`, wrong certificate paths, or leftover `YOUR_DOMAIN` placeholders in `nginx/conf.d.stag/includes/netsentinel-ssl.conf`. Fix the files on the host, then run `nginx -t` again before reload.

**“Wrong directory” or Compose cannot find `.env`**  
Commands must be run from the directory that contains `docker-compose.stag.yml` and `.env` (the `data-plane` root). `env_file: .env` is relative to that compose file.

**Build step is slow or fails during `up --build`**  
First builds download base images and dependencies. Retry after a clean network. If a step fails, scroll the build output for the first error (often Python or Node in the Dockerfile layer). Ensure enough disk space on the host for image layers.

For image build and registry problems, see [DOCKER_HUB_DEPLOYMENT.md](DOCKER_HUB_DEPLOYMENT.md) troubleshooting there.
