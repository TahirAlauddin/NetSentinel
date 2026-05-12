# NetSentinel — Documentation

Welcome to the NetSentinel documentation. Use the table of contents below to navigate.

---

## For Developers

Resources for contributors and anyone working on the codebase.

| Document | Description |
|---|---|
| [Contributing Guide](developer/CONTRIBUTING_GUIDE.md) | How to contribute — branches, PRs, review process |
| [Coding Standards](developer/CODING_STANDARDS.md) | Style guides, patterns, and code conventions |
| [Code Quality Checklist](developer/CODE_QUALITY_CHECKLIST.md) | Pre-PR checklist to verify code quality |
| [Production Checklist](developer/PRODUCTION_CHECKLIST.md) | Steps to validate before releasing to production |
| [Testing Guide](developer/TESTING_GUIDE.md) | How to run and write tests |

---

## Deployment

Guides for getting NetSentinel running in different environments.

| Document | Description |
|---|---|
| [Local Setup](deployment/LOCAL_SETUP.md) | Run the project locally for development |
| [Docker Deployment](deployment/DOCKER_DEPLOYMENT.md) | Deploy using Docker / Docker Compose |
| [SSH / Manual Deployment](deployment/SSH_DEPLOYMENT.md) | Deploy manually to a remote server via SSH |
| [CI/CD Pipeline](deployment/CI_CD.md) | Automated deployment via CI/CD |
| [Kubernetes — Minikube Setup](deployment/k8s/MINIKUBE_SETUP.md) | Local Kubernetes with Minikube |
| [Kubernetes — Provisioning](deployment/k8s/PROVISIONING_GUIDE.md) | Provisioning a production Kubernetes cluster |
| [Kubernetes — Troubleshooting](deployment/k8s/TROUBLESHOOTING_GUIDE.md) | Common Kubernetes issues and fixes |

---

## Architecture

System design and technical decisions.

| Document | Description |
|---|---|
| [Overview](architecture/OVERVIEW.md) | High-level architecture and system design |
| [Decisions (ADRs)](architecture/DECISIONS.md) | Log of key architectural decisions |

---

## API

| Document | Description |
|---|---|
| [API Overview](api/API_OVERVIEW.md) | Cross-service API summary and auth model |

> For per-service API docs, see each service's own `docs/api/` folder.

---

## Security

| Document | Description |
|---|---|
| [Security Overview](security/SECURITY_OVERVIEW.md) | Auth model, secrets management, vulnerability reporting |

---

## Changelog

| Document | Description |
|---|---|
| [Changelog](changelog/CHANGELOG.md) | Release notes and version history |

---

## Service-Specific Docs

Each service maintains its own `docs/` folder for implementation details.

| Service | Docs |
|---|---|
| data-plane | [data-plane/docs/](../data-plane/docs/) |
