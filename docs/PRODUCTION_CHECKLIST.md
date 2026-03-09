# Production Readiness Checklist

A comprehensive checklist for shipping a production-ready application. Use this to audit NetSentinel or any similar full-stack app.

---

## 1. Security

### 1.1 Configuration & Secrets
- [ ] **No hardcoded secrets** – All secrets (API keys, DB passwords, signing keys) from environment or secret manager
- [ ] **Secret rotation** – Process and docs for rotating `SECRET_KEY`, DB credentials, JWT signing keys
- [ ] **`.env` not committed** – `.env` in `.gitignore`; only `.env.example` (no real values) in repo
- [ ] **DEBUG off in production** – `DEBUG=False` (or equivalent) in prod; no stack traces to users

### 1.2 Application Security
- [ ] **HTTPS only** – TLS in production; redirect HTTP → HTTPS; `SECURE_SSL_REDIRECT` (Django) or equivalent
- [ ] **Secure cookies** – Session/CSRF cookies `Secure`, `HttpOnly`, `SameSite` where applicable
- [ ] **Security headers** – HSTS, X-Content-Type-Options, X-Frame-Options, CSP (or minimal safe set)
- [ ] **CSRF protection** – Enabled for state-changing requests; trusted origins configured
- [ ] **CORS** – Explicit allow-list of origins; no `*` in production
- [ ] **Authentication** – Strong auth (e.g. JWT/OAuth) with secure token storage and expiry
- [ ] **Password policy** – Minimum length, complexity, and optional breach checks
- [ ] **Rate limiting** – On login, password reset, and critical APIs to prevent abuse
- [ ] **Input validation & sanitization** – Server-side validation; protection against injection (SQL, command, XSS)
- [ ] **Authorization** – Role/permission checks on every protected endpoint; no “hidden” admin routes

### 1.3 Dependencies & Supply Chain
- [ ] **Dependency scanning** – Regular scans (e.g. Dependabot, Snyk, `pip audit`, `npm audit`)
- [ ] **Pinned versions** – Lockfiles (e.g. `requirements.txt`, `package-lock.json`) committed and used in CI/CD
- [ ] **Minimal attack surface** – Unused packages removed; only necessary permissions/capabilities in containers

---

## 2. Reliability & Operations

### 2.1 Health & Readiness
- [ ] **Liveness probe** – Endpoint that returns 200 when the process is up (e.g. `/api/health`)
- [ ] **Readiness probe** – Endpoint that returns 200 only when app can serve traffic (DB/cache connected)
- [ ] **Deep health checks** – Optional dependency checks (DB, Redis, external APIs) for ops dashboards
- [ ] **Startup ordering** – Containers/orchestration wait for DB and other deps before accepting traffic

### 2.2 Logging
- [ ] **Structured logging** – JSON or consistent format; log levels (DEBUG, INFO, WARN, ERROR)
- [ ] **No secrets in logs** – Passwords, tokens, PII never logged
- [ ] **Request/Correlation IDs** – Trace requests across services
- [ ] **Centralized log aggregation** – Logs shipped to a central store (e.g. ELK, Loki, cloud logging)
- [ ] **Log retention policy** – Defined retention and access control

### 2.3 Error Handling & Observability
- [ ] **Global error handling** – Uncaught exceptions caught; user sees generic message; no stack traces in prod
- [ ] **Error reporting** – Integration with Sentry or similar; errors reported with context
- [ ] **Error boundaries (frontend)** – React/Next error boundaries for UI; fallback and recovery path
- [ ] **Metrics / APM** – Latency, error rate, throughput (e.g. Prometheus, Datadog, OpenTelemetry)
- [ ] **Alerting** – Alerts on errors, latency, and availability; on-call/runbook documented

### 2.4 Database
- [ ] **Migrations** – Schema managed via migrations; migrations run in CI and as part of deploy
- [ ] **Backups** – Automated DB backups; tested restore procedure; point-in-time recovery if required
- [ ] **Connection handling** – Pools and timeouts; no connection leaks under load
- [ ] **Idempotent migrations** – Safe to re-run where possible; backward compatibility during rollout

### 2.5 Availability & Performance
- [ ] **Graceful shutdown** – Drain in-flight requests; close DB/cache connections cleanly
- [ ] **Timeouts** – Timeouts on HTTP, DB, and external calls to avoid hung requests
- [ ] **Resource limits** – CPU/memory limits in containers/orchestration to avoid noisy neighbors
- [ ] **Caching** – Where appropriate (e.g. sessions, static data); cache invalidation strategy
- [ ] **CDN/static assets** – Static and media served via CDN or optimized path in production

---

## 3. CI/CD & Deployment

### 3.1 Build & Test
- [ ] **CI on every PR** – Lint, unit tests, and integration tests run on push/PR
- [ ] **Branch protection** – Main/production branch protected; PR review and passing CI required
- [ ] **Deploy from CI** – Production deploy triggered from pipeline (e.g. tag or main); no manual FTP
- [ ] **Build reproducibility** – Same commit → same build (pinned base images, lockfiles)
- [ ] **Smoke tests post-deploy** – Health check or minimal E2E after deploy to verify app is up

### 3.2 Environments
- [ ] **Staging environment** – Mirrors production (config, DB, dependencies) for pre-prod testing
- [ ] **Environment parity** – Same OS/runtime versions where possible; config via env, not code paths
- [ ] **Secrets per environment** – Separate secrets for dev/staging/production

### 3.3 Rollout & Rollback
- [ ] **Rollback plan** – Documented and tested (e.g. redeploy previous image, DB rollback if needed)
- [ ] **Zero-downtime deploys** – Blue/green, rolling, or canary; health checks drive traffic shift
- [ ] **Database migration strategy** – Backward-compatible migrations; deploy order (e.g. backend before frontend) documented

---

## 4. API & Frontend

### 4.1 API
- [ ] **API versioning** – Version in URL or header (e.g. `/api/v1/`); deprecation policy
- [ ] **Documentation** – OpenAPI/Swagger or equivalent; kept in sync with code
- [ ] **Consistent error format** – Same structure for validation and server errors (e.g. RFC 7807 or custom JSON)
- [ ] **Pagination** – List endpoints paginated; consistent `limit`/`offset` or cursor
- [ ] **Throttling** – Rate limits on public or expensive endpoints; clear headers (e.g. `X-RateLimit-*`)

### 4.2 Frontend
- [ ] **Environment-based config** – API URL and feature flags from env; no hardcoded prod URLs in code
- [ ] **Error states** – User-friendly messages; retry or support contact where appropriate
- [ ] **Loading states** – Skeletons or spinners for async operations
- [ ] **Accessibility** – Basic a11y (focus, labels, contrast); automated checks (e.g. axe) in CI
- [ ] **SEO/Meta** – Title, description, and OG tags where relevant
- [ ] **Client-side validation** – In addition to server validation; consistent rules

---

## 5. Data & Compliance

### 5.1 Data Protection
- [ ] **Sensitive data at rest** – DB and backups encrypted; keys managed securely
- [ ] **Sensitive data in transit** – TLS for all external and internal user-facing traffic
- [ ] **PII handling** – Identify PII; minimize collection; access control and retention policy
- [ ] **Data retention** – Policy for how long data is kept; automated deletion where required

### 5.2 Compliance & Legal
- [ ] **Privacy policy** – Published and linked; describes collection and use
- [ ] **Terms of service** – Published and linked where applicable
- [ ] **Cookie/consent** – Consent mechanism if using non-essential cookies or tracking
- [ ] **Audit trail** – Logging of sensitive actions (e.g. login, permission changes) for compliance

---

## 6. Documentation & Runbooks

- [ ] **README** – How to run locally; prerequisites; link to further docs
- [ ] **Deployment runbook** – Steps to deploy; rollback; where secrets and config live
- [ ] **Operational runbook** – How to handle incidents; who to contact; scaling and restart procedures
- [ ] **Architecture overview** – High-level diagram and description of components
- [ ] **API documentation** – Public or internal API docs; examples and auth instructions
- [ ] **Changelog / release notes** – Notable changes per release for operators and support

---

## 7. Optional but Recommended

- [ ] **Feature flags** – Toggle features without deploy; limit blast radius
- [ ] **Feature toggles per environment** – Different flags in staging vs production
- [ ] **Staged rollouts** – Canary or percentage-based rollout for riskier changes
- [ ] **Chaos/resilience testing** – Occasional failure injection (e.g. DB delay) to verify resilience
- [ ] **Performance budgets** – Frontend bundle size or LCP limits in CI
- [ ] **Internationalization (i18n)** – If targeting multiple locales; strings externalized and translated
- [ ] **Backup verification** – Periodic restore tests to verify backups are usable

---

# NetSentinel Comparison

How the current NetSentinel codebase compares to this checklist. **✅ Done** | **⚠ Partial** | **❌ Missing** | **N/A** Not applicable.

## 1. Security

| Item | Status | Notes |
|------|--------|--------|
| No hardcoded secrets | ⚠ | `SECRET_KEY` has dev fallback in `settings.py`; prod should set `DJANGO_SECRET_KEY` in env. |
| Secret rotation | ❌ | No documented process for rotating secrets. |
| `.env` not committed | ✅ | `.env.example` only; real `.env` expected from environment. |
| DEBUG off in production | ✅ | `DEBUG` from env; defaults to `False`. |
| HTTPS only | ✅ | Staging has nginx + certbot; prod security (HSTS, etc.) in Django when `DEBUG=False`. |
| Secure cookies | ✅ | `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, etc. when not DEBUG. |
| Security headers | ✅ | HSTS, X-Content-Type-Nosniff, X-Frame-Options in production settings. |
| CSRF protection | ✅ | Django CSRF middleware; `CSRF_TRUSTED_ORIGINS` from env. |
| CORS | ✅ | `CORS_ALLOWED_ORIGINS` from env; dev fallback to localhost. |
| Authentication | ✅ | JWT (Simple JWT) + Djoser; NextAuth on frontend. |
| Password policy | ✅ | Django `AUTH_PASSWORD_VALIDATORS` (length, similarity, common, numeric). |
| Rate limiting | ⚠ | Frontend: login/password-reset rate limit (memory/Upstash). Backend: **no DRF throttling** on API. |
| Input validation | ✅ | Backend: `core.security` (sanitize_string, validate_ip, validate_hostname, etc.); DRF serializers. |
| Authorization | ✅ | DRF `IsAuthenticated`; app-level permissions (e.g. `AppPermission`). |
| Dependency scanning | ❌ | No Dependabot/Snyk/audit in CI; manual `pip audit` / `npm audit` possible. |
| Pinned versions | ✅ | `requirements.txt` and lockfiles in use. |
| Minimal attack surface | ✅ | Staging Docker: `cap_drop`, frontend runs as non-root. |

## 2. Reliability & Operations

| Item | Status | Notes |
|------|--------|--------|
| Liveness/readiness | ✅ | Backend `/api/health/` (DB check); frontend `/api/health` returns 200. |
| Deep health checks | ⚠ | Backend health checks DB only; no Redis/external deps. |
| Structured logging | ❌ | No `LOGGING` config in Django settings; ad-hoc `logging` in some apps. |
| No secrets in logs | ⚠ | Not enforced by central config; rely on developer discipline. |
| Request/Correlation IDs | ❌ | Not implemented. |
| Centralized log aggregation | ❌ | Not in repo; deploy-specific. |
| Global error handling | ⚠ | Frontend: `error-handler.ts` + ErrorBoundary; **no Next.js `error.tsx`** for route-level errors. |
| Error reporting (e.g. Sentry) | ❌ | TODOs in `error-handler.ts` and ErrorBoundary; not integrated. |
| Error boundaries | ✅ | Root layout wraps with `ErrorBoundary`. |
| Metrics/APM | ❌ | No Prometheus/OpenTelemetry/Datadog in codebase. |
| Alerting | ❌ | Not in repo. |
| Migrations | ✅ | Django migrations; run via docs and deploy. |
| Backups | ❌ | Provisioning guide mentions “Implement Backup”; no automation in repo. |
| Connection handling | ✅ | Django DB; `connect_timeout` in settings. |
| Graceful shutdown | ⚠ | Default process behavior; no explicit drain documented. |
| Timeouts | ⚠ | DB timeout set; HTTP/external timeouts not consistently documented. |
| Resource limits | ✅ | Staging compose: CPU/memory limits on backend, frontend, postgres. |
| Caching | ⚠ | Session/cache not explicitly configured; rate limit can use Redis. |
| CDN/static | ⚠ | Nginx in staging; CDN not configured in repo. |

## 3. CI/CD & Deployment

| Item | Status | Notes |
|------|--------|--------|
| CI on every PR | ✅ | GitHub Actions: lint (backend/frontend), build, test on push/PR to main & development. |
| Branch protection | N/A | Repo-level setting. |
| Deploy from CI | ✅ | `deploy-staging` on push to main; SSH + docker-compose. |
| Build reproducibility | ✅ | Dockerfiles; CI uses lockfiles. |
| Smoke tests post-deploy | ❌ | No automated smoke/E2E after deploy. |
| Staging environment | ✅ | `docker-compose.stag.yml` with nginx, certbot, postgres, backend, frontend. |
| Environment parity | ⚠ | Staging exists; env vars documented in `.env.example`. |
| Secrets per environment | ⚠ | Uses repo secrets; separate staging/prod secrets recommended. |
| Rollback plan | ❌ | Not documented in repo. |
| Zero-downtime deploys | ⚠ | Single-service compose; no blue/green in repo. |
| DB migration strategy | ✅ | Design docs describe tenant migration rollout. |

## 4. API & Frontend

| Item | Status | Notes |
|------|--------|--------|
| API versioning | ✅ | `/api/v1/` and Swagger `default_version="v1"`. |
| Documentation | ✅ | drf-yasg Swagger/ReDoc; `API_DOCUMENTATION.md`. |
| Consistent error format | ✅ | DRF + frontend `error-handler` / `parseApiError`. |
| Pagination | ✅ | DRF `PageNumberPagination`, `PAGE_SIZE=20`. |
| Throttling (API) | ❌ | No `DEFAULT_THROTTLE_CLASSES` or per-view throttling on Django API. |
| Env-based frontend config | ✅ | `NEXTAUTH_*`, `*_API_URL` from env; `.env.example` present. |
| Error states | ✅ | Error boundary; `handleError` and user-facing messages. |
| Loading states | ⚠ | Implemented in places; not audited app-wide. |
| Accessibility | ❌ | No a11y CI (e.g. axe); not audited. |
| SEO/Meta | ⚠ | Next.js app; not audited for meta/OG. |
| Client-side validation | ✅ | Forms and validation in place. |

## 5. Data & Compliance

| Item | Status | Notes |
|------|--------|--------|
| Sensitive data at rest | ⚠ | DB in Docker; encryption depends on host/cloud. |
| Sensitive data in transit | ✅ | TLS via nginx/certbot in staging. |
| PII handling | ⚠ | Not explicitly documented. |
| Data retention | ❌ | No retention policy in repo. |
| Privacy policy / ToS | ❌ | Not in repo. |
| Cookie/consent | ❌ | Not implemented. |
| Audit trail | ⚠ | Some logging (e.g. IP audit); no comprehensive audit log framework. |

## 6. Documentation & Runbooks

| Item | Status | Notes |
|------|--------|--------|
| README | ✅ | Overview, structure, links to docs. |
| Deployment runbook | ⚠ | CI deploys; path and env are placeholders; no full runbook. |
| Operational runbook | ✅ | `troubleshooting-guide.md`; design and provisioning docs. |
| Architecture overview | ✅ | Design docs; README. |
| API documentation | ✅ | Swagger + `API_DOCUMENTATION.md`. |
| Changelog/release notes | ❌ | No CHANGELOG or release notes in repo. |

## 7. Optional

| Item | Status | Notes |
|------|--------|--------|
| Feature flags | ❌ | Not implemented. |
| Staged rollouts | ❌ | Not in repo. |
| Chaos/resilience testing | ❌ | Not in repo. |
| Performance budgets | ❌ | Not in CI. |
| i18n | ❌ | `LANGUAGE_CODE` en-us; no i18n framework. |
| Backup verification | ❌ | Not in repo. |

---

## Summary: What to Fix First

**High impact, fix soon**

1. **Backend API throttling** – Add DRF throttle classes (e.g. `AnonRateThrottle`, `UserRateThrottle`) to protect APIs.
2. **Structured logging** – Add Django `LOGGING` and use it consistently; ensure no secrets in logs.
3. **Error reporting** – Integrate Sentry (or similar) in backend and frontend; remove TODOs in `error-handler.ts` and ErrorBoundary.
4. **Health check** – Consider a readiness check that verifies DB (and Redis if used); frontend health is minimal (could add dependency check if needed).
5. **Next.js global error UI** – Add `error.tsx` (and optionally `global-error.tsx`) in the app router for route-level failures.
6. **Dependency scanning in CI** – Add `pip audit` and `npm audit` (or Dependabot) to the pipeline.
7. **Backup automation** – Document and implement DB backup (and restore test) for staging/production.
8. **Remove secret fallback** – Require `DJANGO_SECRET_KEY` in production (fail startup if missing).

**Medium impact**

- Document rollback and zero-downtime deploy strategy.
- Add post-deploy smoke test (e.g. hit health endpoint after deploy).
- Add request/correlation IDs for tracing.
- Document PII and retention; add basic audit logging for sensitive actions.
- Add accessibility checks to frontend CI.

**Lower priority**

- Feature flags, i18n, performance budgets, chaos testing – when the product and ops maturity justify it.

Use this checklist as a living doc: update the comparison as you implement each item and re-run the audit before major releases.
