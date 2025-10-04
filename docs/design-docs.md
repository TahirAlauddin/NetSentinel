
# Design Document (v1) — Multi-tenant ITSM with per-tenant Docker sessions and dedicated DBs


## Executive summary

You want a SaaS ITSM where companies (tenants) sign up centrally, then each tenant is assigned a subdomain and a **dedicated runtime (docker session)** and **dedicated database** to ensure isolation and scalability. The shared system handles onboarding, billing, and global features. After signup we provision a tenant-specific container(s) and DB, wire subdomain DNS and TLS, and redirect the tenant admin to their subdomain to log in and invite users.

Key goals: **tenant isolation**, **scalability**, **operational automation**, **cost effectiveness**, **manageability**.

Core components:

* **Shared system (control plane)**: central Django app for landing, registration, billing, tenant orchestration API.
* **Tenant runtime (data plane)**: per-tenant Docker runtime(s) running Django + Next.js (or Next static + API endpoints). Each runtime connects only to its own DB and per-tenant resources.
* **Orchestration layer**: Kubernetes + Helm / Terraform or an automated Docker orchestration system (ECS/Fargate also possible).
* **Networking layer**: Ingress controller (Traefik/NGINX) + wildcard DNS + cert-manager for TLS.
* **Data storage**: Postgres logical DB per tenant (or per-tenant Postgres instance — see tradeoffs), S3 (object store) with tenant prefixes.
* **Shared services**: Redis (shared), Celery workers (shared or per-tenant), central logging, monitoring, secrets manager.

---

## High-level architecture (textual)

1. User visits `netsentinel.com` → central UI (Next.js) served by shared system.
2. Company registers and provides primary admin details, billing info.
3. Control plane (Django) verifies, creates tenant record and issues provisioning job.
4. Provisioner:

   * Creates tenant DB (logical database or new instance).
   * Creates per-tenant secrets (DB credentials) in Secrets Manager/Kubernetes secret.
   * Deploys tenant container(s) (Django API + Next.js frontend) in an isolated namespace (K8s) or separate ECS service/task.
   * Configures ingress route `techhoseki.netsentinel.com` and requests TLS certificate (cert-manager/Let's Encrypt).
   * Configures DNS via ExternalDNS/Cloud DNS APIs.
   * Runs initial DB migrations and seed admin user.
5. Provisioner returns success; redirect admin to the tenant subdomain for login.
6. Tenant users sign in at `techhoseki.netsentinel.com` — the tenant container handles auth locally against that tenant DB (or a shared auth service if you prefer SSO across tenants).

---

## Component designs & choices

### 1. Control Plane (shared Django)

**Responsibilities**

* Registration, billing, admin portal.
* Provisioning orchestrator (API to create DBs, secrets, deployments).
* Global tenant metadata store (tenant id ➜ subdomain ➜ infra metadata).
* Centralized audit logs for provision operations.
* Admin console for tenant lifecycle (deactivate, snapshot, restore, delete).

**Tech notes**

* Django Rest Framework for internal APIs.
* Use Celery for background provisioning tasks.
* Persist control plane state in its own Postgres DB.

### 2. Data Plane (tenant runtime)

**Responsibilities**

* Application logic, tenant data, auth, user management for that tenant’s company.

**Isolation**

* Container(s) run in a K8s namespace (or dedicated ECS service) with network policies restricting access to other tenants.
* Each runtime uses **only** tenant-specific DB credentials, per-tenant S3 prefix, and tenant-level secrets.

**Auth**

* Per-tenant user table in tenant DB. Alternatively, if you want cross-tenant single sign-on or centralized user directory, implement centralized identity provider — but that reduces isolation.

### 3. Database design options (tradeoffs)

**Option A — Separate logical database per tenant (recommended balanced approach)**

* Use one Postgres cluster; create a new logical database per tenant (`tenant_123_db`).
* Pros: Easier to manage at scale, cheaper, simpler for backups per-db, one Postgres cluster with connection pooling.
* Cons: Possible noisy neighbor in single DB server; heavy tenants could require scaling the cluster.

**Option B — Separate Postgres instance per tenant (max isolation)**

* Provision a new Postgres instance (RDS instance or VM) per tenant.
* Pros: Strong isolation and security, individual resource control.
* Cons: Expensive; operationally heavy for many tenants. Not recommended unless tenants require strict compliance.

**Option C — Shared DB with schema-per-tenant (Django-tenants style)**

* Single database, schema per tenant.
* Pros: Fewer DB connections, simpler single server management.
* Cons: The single DB server is a single point of failure; less strong isolation.

**Recommendation:** Use **Option A** to start: logical DB per tenant on a managed Postgres cluster with autoscaling and per-db backups. If you later have a few very large tenants requiring full isolation, move them to dedicated instances.

**Backups & restore**

* Use automated per-DB backups (e.g., RDS snapshots or pg_dump). Support per-tenant restore and point-in-time recovery if needed.

**Migrations**

* Tenant-specific migrations: keep migrations in main repo; when new release requires DB schema migration, the control plane should iterate through tenant DBs (or run a K8s Job per tenant) to apply migrations. Support staged rollouts.

### 4. Orchestration & deployment

**Recommended: Kubernetes (EKS/GKE/AKS)**

* Use namespaces per-tenant (or per-tenant deployments). Use resource quotas and limits.
* Use Helm charts for the app; a templated Helm release per tenant.
* Use Horizontal Pod Autoscaler for each tenant deployment to scale by CPU/RPS.

**If not using K8s**

* AWS ECS + Fargate for serverless-like containers can also work; have separate ECS service per tenant.

**Secrets**

* Use cloud Secrets Manager or Kubernetes Secrets (sealed/secrets-store-csi-driver) with rotation.

**Provisioning flow**

* Control plane calls Terraform/Cloud SDK or Kubernetes API to:

  * Create DB
  * Create secret
  * Helm install/upgrade per tenant
  * Create ingress route
  * Trigger cert issuance

**Container images**

* Build a single multi-tenant-capable image; same code for all tenants. Keep environment variables to inject tenant-specific config at runtime.

### 5. Networking, DNS, TLS

* Use **wildcard DNS** `*.netsentinel.com` and dynamic DNS records created by ExternalDNS.
* Ingress controller (Traefik or NGINX) to route to tenant K8s services based on host header.
* Use cert-manager to provision Let's Encrypt certificates per subdomain or wildcard certs (note rate limits).
* Use an API gateway if you want global filtering and WAF.

### 6. Storage & files

* Use S3 (or GCS) and prefix each tenant’s files under `tenant_id/` or `company_slug/`.
* Use lifecycle rules for retention and archiving.

### 7. Background jobs & caching

* **Redis** as shared cache and Celery broker. Each tenant’s tasks can include tenant_id context.
* Optionally, provide per-tenant Celery queues (if heavy tenants) to prevent queue starvation.
* Cache keys must be prefixed with tenant id.

### 8. Logging & monitoring

* Centralized logging (ELK/EFK or Datadog/Loggly) with tenant_id metadata on logs.
* Monitoring (Prometheus + Grafana) for cluster health, plus per-tenant metrics (requests, errors).
* Alerts scoped to control-plane and data-plane health.

### 9. Security & compliance

* Enforce network policies in K8s to isolate tenant namespaces.
* Per-tenant DB credentials, rotated regularly.
* TLS for all ingress.
* Audit logging for admin-level actions and user auth changes.
* Role Based Access Control: separate support/admin roles in control-plane vs tenant-level admin roles.

### 10. Billing and cost controls

* Track per-tenant resource usage (CPU, memory, DB storage, object storage).
* Implement quota enforcement: set resource quotas and max DB size; optionally throttle or autoscale with billing.
* Provide billing tiers (e.g., small/standard/enterprise) — different resource allocations or dedicated instances.

---

## Provisioning sequence (detailed)

1. Tenant registration on shared app.
2. Validate email/payment.
3. **Provisioner job** (Celery):

   * Create DB (new logical DB in Postgres cluster). Store DB credentials in Secrets Manager.
   * Generate tenant secret (JWT secret, config).
   * Helm install a release for tenant in `tenant-{id}` K8s namespace:

     * Values: DB credentials, S3 prefix, tenant slug, resource limits, feature flags.
   * Run `kubectl exec` or run a one-off migration Job to run Django migrations and create admin user.
   * Configure DNS record via ExternalDNS (or direct cloud DNS API).
   * Request TLS via cert-manager; wait for ready state.
4. Return success and redirect admin to tenant URL.

**Edge cases & retries**

* Provisioner must be idempotent and support rollback on failure.
* Use state machine to track provisioning phase (DB created, deployment done, cert ready, etc.).
* Have cleanup routines for failed/provision attempts.

---

## Tenant lifecycle operations

* **Deactivate**: scale down deployment, restrict login, freeze billing.
* **Snapshot**: create DB dump and S3 archive.
* **Restore**: restore DB and re-deploy app with restored data.
* **Delete**: delete K8s namespace, delete DB, remove S3 objects (confirm with retention rules).
* **Upgrade**: run migration jobs and sequentially upgrade tenant deployments.

---

## Multi-tenant security checklist (must-have)

* Per-tenant DB credentials; never share DB creds.
* Network policies to restrict intra-cluster access.
* Enforce CSP/headers, input validation, rate limits.
* Keep secrets in secrets manager (KMS-encrypted).
* Pen-test and code review especially for endpoints that might allow cross-tenant access (e.g., APIs accepting tenant_id parameter).
* Strict RBAC for support staff; access logging.

---

## Migration & schema upgrades

* Keep migrations in central repo.
* Strategy for upgrades:

  1. Deploy code compatible with both old/new schema where possible (expand-contract).
  2. Run migrations per tenant with a controlled rollout (batch tenants).
  3. Monitor errors, then promote to full rollout.
* Automate migration Job runner that runs against each tenant DB in batches and can be resumed safely.

---


## Observability & support tools

* Tenant-aware logs, traces (OpenTelemetry).
* Control-plane UI: tenant list, health, DB size, pod resource usage, last backup.
* On-call runbooks for common failures (DNS, cert, DB out-of-space).
* Playbooks for tenant restoration.

---

## Example tech stack (recommended)

* **Control plane**: Django + DRF + Celery
* **Tenant runtime**: Django (API) + Next.js (frontend static + SSR) served from per-tenant deployment
* **DB**: PostgreSQL (managed, logical DB per tenant)
* **Orchestration**: Kubernetes (EKS/GKE) + Helm
* **Ingress**: Traefik or NGINX + cert-manager + ExternalDNS
* **Storage**: S3
* **Broker/cache**: Redis
* **CI/CD**: GitHub Actions + Helm chart publishing + image registry
* **Secrets**: AWS Secrets Manager / HashiCorp Vault
* **Monitoring**: Prometheus + Grafana, and optionally Datadog
* **Logging**: EFK stack or a hosted service
* **Observability**: OpenTelemetry traces

---

## Operational runbook (short)

* **Provisioning failure**: check provisioner queue (Celery), DB creation logs, Helm status, cert-manager events.
* **DB out of space**: alert -> scale DB (increase size) -> notify tenant.
* **Tenant outage**: control-plane health check -> attempt restart -> check ingress and DNS.
* **Security breach**: revoke tenant credentials, rotate secrets, snapshot data, isolate tenant.

---

## Potential problems & mitigations

* **Noisy neighbor**: heavy tenant hogs CPU/DB. Mitigate with resource quotas, DB throttling, and per-tenant queues.
* **Too many DBs**: connection limits and backup overhead. Mitigate with pooling and sharding strategy.
* **Cert rate limits**: use wildcard certs when possible; otherwise, implement ACME rate limit handling and staging.
* **Provisioning race conditions**: implement idempotency and distributed locks.

---

## Simple ASCII diagram

```
 +-----------------+         +------------------+        +----------------+
 |  Shared Website | <-----> | Control Plane DB |        | Billing/Stripe |
 |  netsentinel.com|         +------------------+        +----------------+
 +--------+--------+
          |
          | Provisioning API (Django)
          v
 +-----------------------+     +------------------+
 | Kubernetes Cluster    |     | Postgres Cluster |
 | (Ingress, Namespaces) |     | (logical DBs)    |
 |  +---------------+    |     +------------------+
 |  | tenant-releases|---|-->  | tenant_db_1      |
 |  | tenant-namespace|    |     | tenant_db_2      |
 |  +---------------+    |     | ...              |
 +-----------------------+     +------------------+
          |
          v
 +-----------------+   +----------------+   +----------------+
 | S3 (tenant/)    |   | Redis (shared) |   | Logging / APM  |
 +-----------------+   +----------------+   +----------------+
```

---

## ASCII diagram (alternate)

```
                 netsentinel.com
                       |
               +-------+--------+
               | Control Plane  |
               | (Django/DRF)   |
               +-------+--------+
                       |
                 Provisioner
                       |
             +---------+---------+
             | Kubernetes Cluster|
             +---------+---------+
                       |
    +------------------+------------------+
    |                                   |
 tenant-1 ns                         tenant-N ns
 (techhoseki)                        (acme)
  |                                    |
  |-- pod(s) app                       |-- pod(s) app
  |-- Postgres container (dedicated)   |-- Postgres container (ded.)
  |-- secrets, configmaps              |-- secrets, configmaps
```
