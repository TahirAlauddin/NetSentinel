# Development Setup Guide

This guide explains how to set up the NetSentinel Control Plane for local development with tenant provisioning.

## Prerequisites

1. **Python 3.11+** - For running Django backend
2. **Docker & Docker Compose** - For running Redis and services
3. **Minikube** - For local Kubernetes cluster
4. **kubectl** - Kubernetes command-line tool

## Step 1: Install Minikube

### Windows
```powershell
# Using Chocolatey
choco install minikube

# Or download from: https://minikube.sigs.k8s.io/docs/start/
```

### Linux/Mac
```bash
# Follow instructions at: https://minikube.sigs.k8s.io/docs/start/
```

## Step 2: Start Minikube

```powershell
# Start minikube with sufficient resources
minikube start --memory=8192 --cpus=4 --disk-size=20g

# Enable required addons
minikube addons enable ingress
minikube addons enable ingress-dns
minikube addons enable storage-provisioner
minikube addons enable metrics-server

# Get kubeconfig path (Windows)
$env:KUBECONFIG = "$env:USERPROFILE\.minikube\profiles\minikube\config.json"

# Or for Linux/Mac
export KUBECONFIG=~/.kube/config
```

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```powershell
   cd control-plane/src/backend
   Copy-Item .env.example .env
   ```

2. Update `.env` with your configuration:
   ```env
   KUBECONFIG=C:\Users\YourName\.minikube\profiles\minikube\config.json
   # Or for Linux/Mac: KUBECONFIG=~/.kube/config
   K8S_IN_CLUSTER=false
   ```

## Step 4: Install Python Dependencies

```powershell
cd control-plane/src/backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
# venv\Scripts\activate.bat
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Step 5: Set Up Database

```powershell
# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

## Step 6: Start Services with Docker Compose

```powershell
cd control-plane

# Start Redis and services
docker-compose up -d

# Check services are running
docker-compose ps
```

This will start:
- **Redis** on port 6379 (Celery broker)
- **Backend** on port 8000
- **Celery Worker** (for processing provisioning tasks)

## Step 7: Start Celery Worker (Alternative - Without Docker)

If you prefer to run Celery worker directly (not in Docker):

```powershell
cd control-plane/src/backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start Celery worker
celery -A core worker --loglevel=info
```

## Step 8: Verify Setup

1. **Check Redis is running:**
   ```powershell
   docker-compose ps redis
   ```

2. **Check backend is accessible:**
   ```powershell
   curl http://localhost:8000/api/v1/
   ```

3. **Check Celery worker is running:**
   ```powershell
   # In Celery worker logs, you should see:
   # celery@hostname ready.
   ```

4. **Verify Kubernetes connection:**
   ```powershell
   kubectl get nodes
   # Should show minikube node
   ```

## Testing Tenant Provisioning

### 1. Create a Company (Auto-provisioning)

When you create a Company through the API or admin, provisioning will automatically trigger:

```powershell
# Using Django admin
python manage.py runserver
# Navigate to http://localhost:8000/admin
# Create a new Company

# Or using API (with authentication)
curl -X POST http://localhost:8000/api/v1/auth/users/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "testpass123", "company": {...}}'
```

### 2. Manual Provisioning Trigger

```powershell
# POST to provisioning endpoint
curl -X POST http://localhost:8000/api/v1/provisioning/tenants/{company_id}/provision/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```

### 3. Check Provisioning Status

```powershell
# GET provisioning status
curl http://localhost:8000/api/v1/provisioning/tenants/{company_id}/status/ \
  -H "Authorization: Bearer {token}"
```

### 4. Verify in Kubernetes

```powershell
# List namespaces
kubectl get namespaces

# Check tenant namespace
kubectl get all -n tenant-{company-name}-{id}

# Check deployments
kubectl get deployments -n tenant-{company-name}-{id}

# Check pods
kubectl get pods -n tenant-{company-name}-{id}
```

## Troubleshooting

### Celery Worker Not Processing Tasks

1. Check Redis is running:
   ```powershell
   docker-compose ps redis
   ```

2. Check Celery worker logs:
   ```powershell
   docker-compose logs celery-worker
   ```

3. Verify CELERY_BROKER_URL in `.env` matches Redis connection

### Kubernetes Connection Issues

1. Verify kubeconfig path:
   ```powershell
   echo $env:KUBECONFIG  # Windows
   # or
   echo $KUBECONFIG      # Linux/Mac
   ```

2. Test kubectl:
   ```powershell
   kubectl get nodes
   ```

3. If using minikube, ensure it's running:
   ```powershell
   minikube status
   ```

### Provisioning Fails

1. Check Celery worker logs for errors
2. Check TenantProvisioning model in Django admin for error messages
3. Verify Kubernetes cluster has sufficient resources:
   ```powershell
   kubectl top nodes
   ```

### Namespace Already Exists Error

If provisioning fails with "namespace already exists", you can:
1. Delete the namespace manually:
   ```powershell
   kubectl delete namespace tenant-{name}-{id}
   ```
2. Retry provisioning with `force: true` in the API call

## Development Workflow

1. **Make code changes** in `control-plane/src/backend/`
2. **Restart services** if needed:
   ```powershell
   docker-compose restart backend celery-worker
   ```
3. **Run migrations** if model changes:
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```
4. **Test provisioning** by creating a Company or using the API

## Next Steps

- Configure ingress for tenant subdomains
- Set up TLS certificates (cert-manager)
- Configure DNS for tenant subdomains
- Set up monitoring and logging

