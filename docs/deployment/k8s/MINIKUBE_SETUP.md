# NetSentinel Local Development Setup Guide

This guide will help you set up NetSentinel for local development using Minikube.

## Prerequisites

### Required Software

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before proceeding

2. **Minikube**
   - Windows: `choco install minikube` or download from https://minikube.sigs.k8s.io/docs/start/
   - Mac: `brew install minikube`
   - Linux: Follow instructions at https://minikube.sigs.k8s.io/docs/start/

3. **kubectl**
   - Windows: `choco install kubernetes-cli`
   - Mac: `brew install kubectl`
   - Linux: Follow instructions at https://kubernetes.io/docs/tasks/tools/install-kubectl/

4. **Helm**
   - Windows: `choco install kubernetes-helm`
   - Mac: `brew install helm`
   - Linux: `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash`

### Verify Installation

```bash
docker --version
minikube version
kubectl version --client
helm version
```

## Minikube Setup

### 1. Start Minikube with Required Resources

```bash
# Start Minikube with sufficient resources for multi-tenant development
minikube start --memory=8192 --cpus=4 --disk-size=20g

# Verify cluster is running
kubectl get nodes
```

### 2. Enable Required Addons

```bash
# Enable ingress controller
minikube addons enable ingress

# Enable ingress DNS for local domain resolution
minikube addons enable ingress-dns

# Enable storage provisioner for persistent volumes
minikube addons enable storage-provisioner

# Enable metrics server for resource monitoring
minikube addons enable metrics-server

# Verify addons are enabled
minikube addons list
```

### 3. Configure Local DNS Resolution

#### Option A: Using hosts file (Recommended for Windows)

Add the following entries to your hosts file:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux**: `/etc/hosts`

```
# NetSentinel local development domains
127.0.0.1 netsentinel.local
127.0.0.1 *.netsentinel.local
```

#### Option B: Using dnsmasq (Mac/Linux)

```bash
# Install dnsmasq
brew install dnsmasq  # Mac
# or apt-get install dnsmasq  # Ubuntu/Debian

# Configure dnsmasq
echo "address=/.netsentinel.local/127.0.0.1" >> /usr/local/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq  # Mac
# or sudo systemctl start dnsmasq  # Linux
```

### 4. Get Minikube IP and Configure Port Forwarding

```bash
# Get Minikube IP
minikube ip

# Port forward for external access (optional)
kubectl port-forward --address 0.0.0.0 service/ingress-nginx-controller 80:80 -n ingress-nginx
```

## Infrastructure Deployment

### 1. Create Namespaces

```bash
# Create control plane namespace
kubectl create namespace control-plane

# Create tenant namespaces (examples)
kubectl create namespace tenant-demo
kubectl create namespace tenant-test
```

### 2. Deploy Core Infrastructure

```bash
# Deploy PostgreSQL
kubectl apply -f infrastructure/postgres/deploy.yaml

# Deploy Redis
kubectl apply -f infrastructure/redis/deploy.yaml

# Deploy Ingress Configuration
kubectl apply -f infrastructure/ingress/config.yaml
```

### 3. Verify Deployments

```bash
# Check all pods are running
kubectl get pods --all-namespaces

# Check services
kubectl get services --all-namespaces

# Check ingress
kubectl get ingress --all-namespaces
```

## Development Workflow

### 1. Building and Pushing Images

```bash
# Build control plane image
docker build -t netsentinel/control-plane:latest data-plane/src/backend/

# Build tenant app image
docker build -t netsentinel/tenant-app:latest data-plane/src/frontend/

# Load images into Minikube
minikube image load netsentinel/control-plane:latest
minikube image load netsentinel/tenant-app:latest
```

### 2. Deploying Applications

```bash
# Deploy control plane
kubectl apply -f data-plane/src/backend/k8s/

# Deploy tenant app (example)
helm install tenant-demo data-plane/src/frontend/helm/ -n tenant-demo
```

### 3. Accessing Applications

- Control Plane: http://netsentinel.local
- Tenant Apps: http://{subdomain}.netsentinel.local (e.g., http://demo.netsentinel.local)

## Troubleshooting

### Common Issues

1. **Minikube not starting**
   ```bash
   minikube delete
   minikube start --memory=8192 --cpus=4 --disk-size=20g
   ```

2. **DNS resolution not working**
   - Verify hosts file entries
   - Try accessing via IP: `kubectl get ingress -o wide`

3. **Images not found**
   ```bash
   minikube image load netsentinel/control-plane:latest
   ```

4. **Port forwarding issues**
   ```bash
   kubectl port-forward service/control-plane-service 8000:8000 -n control-plane
   ```

### Useful Commands

```bash
# View logs
kubectl logs -f deployment/control-plane -n control-plane

# Describe resources
kubectl describe pod <pod-name> -n <namespace>

# Access shell
kubectl exec -it <pod-name> -n <namespace> -- /bin/bash

# Minikube dashboard
minikube dashboard
```

## Next Steps

1. Follow the Data Plane setup in `data-plane/docs/DEVELOPMENT.md`
2. Deploy tenant applications using Helm charts
3. Test the provisioning workflow
4. Refer to `docs/provisioning-guide.md` for tenant management

## Cleanup

```bash
# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete

# Remove hosts file entries (if added manually)
# Edit hosts file and remove NetSentinel entries
```
