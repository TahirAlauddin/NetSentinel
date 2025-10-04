# NetSentinel Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the NetSentinel multi-tenant ITSM platform.

## Quick Diagnostics

### Check System Status

```bash
# Overall cluster status
kubectl get nodes
kubectl get pods --all-namespaces
kubectl get services --all-namespaces
kubectl get ingress --all-namespaces

# Minikube status
minikube status
minikube ip
```

### Check Application Health

```bash
# Control plane health
curl -f http://netsentinel.local/api/v1/health/ || echo "Control plane unhealthy"

# Tenant app health (replace {subdomain} with actual subdomain)
curl -f http://{subdomain}.netsentinel.local/api/v1/health/ || echo "Tenant app unhealthy"
```

## Common Issues and Solutions

### 1. Minikube Issues

#### Minikube Won't Start

**Symptoms:**
- `minikube start` fails
- Error messages about insufficient resources

**Solutions:**

```bash
# Check system resources
free -h
df -h

# Start with more resources
minikube start --memory=8192 --cpus=4 --disk-size=20g

# If still failing, try different driver
minikube start --driver=docker --memory=8192 --cpus=4 --disk-size=20g

# Clean start
minikube delete
minikube start --memory=8192 --cpus=4 --disk-size=20g
```

#### Addons Not Enabling

**Symptoms:**
- Ingress controller not working
- Storage issues

**Solutions:**

```bash
# Check addon status
minikube addons list

# Enable required addons
minikube addons enable ingress
minikube addons enable ingress-dns
minikube addons enable storage-provisioner
minikube addons enable metrics-server

# Restart if needed
minikube stop
minikube start --memory=8192 --cpus=4 --disk-size=20g
```

### 2. DNS Resolution Issues

#### Can't Access Applications

**Symptoms:**
- `netsentinel.local` not resolving
- Tenant subdomains not working

**Solutions:**

```bash
# Check hosts file
cat /etc/hosts | grep netsentinel

# Add DNS entries (Linux/Mac)
echo "127.0.0.1 netsentinel.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 *.netsentinel.local" | sudo tee -a /etc/hosts

# Add DNS entries (Windows)
# Edit C:\Windows\System32\drivers\etc\hosts
# Add: 127.0.0.1 netsentinel.local
# Add: 127.0.0.1 *.netsentinel.local

# Test DNS resolution
nslookup netsentinel.local
ping netsentinel.local
```

#### Wildcard DNS Not Working

**Symptoms:**
- `*.netsentinel.local` not resolving

**Solutions:**

```bash
# Use dnsmasq for wildcard DNS (Linux/Mac)
brew install dnsmasq  # Mac
# apt-get install dnsmasq  # Ubuntu/Debian

# Configure dnsmasq
echo "address=/.netsentinel.local/127.0.0.1" >> /usr/local/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq  # Mac
# sudo systemctl start dnsmasq  # Linux

# Test wildcard DNS
nslookup test.netsentinel.local
```

### 3. Database Issues

#### PostgreSQL Connection Errors

**Symptoms:**
- Control plane can't connect to database
- Tenant apps failing to start

**Solutions:**

```bash
# Check PostgreSQL pod
kubectl get pods -n control-plane -l app=postgres

# Check PostgreSQL logs
kubectl logs -f deployment/postgres -n control-plane

# Test database connection
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "\l"

# Check database service
kubectl get service -n control-plane postgres-service

# Restart PostgreSQL if needed
kubectl rollout restart deployment/postgres -n control-plane
```

#### Database Creation Failures

**Symptoms:**
- Tenant provisioning fails at database creation step

**Solutions:**

```bash
# Check database permissions
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "\du"

# Check existing databases
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "\l"

# Manually create database if needed
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "CREATE DATABASE tenant_test;"
```

### 4. Application Deployment Issues

#### Control Plane Won't Start

**Symptoms:**
- Control plane pods in CrashLoopBackOff
- API endpoints not responding

**Solutions:**

```bash
# Check pod status
kubectl get pods -n control-plane -l app=control-plane

# Check pod logs
kubectl logs -f deployment/control-plane -n control-plane

# Check pod events
kubectl describe pod -n control-plane -l app=control-plane

# Check resource limits
kubectl describe pod -n control-plane -l app=control-plane | grep -A 5 "Limits:"

# Restart deployment
kubectl rollout restart deployment/control-plane -n control-plane
```

#### Tenant App Deployment Failures

**Symptoms:**
- Tenant pods not starting
- Helm deployment fails

**Solutions:**

```bash
# Check Helm releases
helm list --all-namespaces

# Check specific tenant deployment
helm status tenant-{slug} -n tenant-{slug}

# Check tenant pod logs
kubectl logs -f deployment/tenant-{slug} -n tenant-{slug}

# Check tenant namespace
kubectl get all -n tenant-{slug}

# Redeploy tenant
helm uninstall tenant-{slug} -n tenant-{slug}
helm install tenant-{slug} tenant_app/helm/ -n tenant-{slug} --values values.yaml
```

### 5. Ingress and Networking Issues

#### Ingress Controller Problems

**Symptoms:**
- Applications not accessible via domain names
- 404 errors when accessing applications

**Solutions:**

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress controller logs
kubectl logs -f deployment/ingress-nginx-controller -n ingress-nginx

# Check ingress resources
kubectl get ingress --all-namespaces

# Check ingress status
kubectl describe ingress -n control-plane
kubectl describe ingress -n tenant-{slug}

# Restart ingress controller
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

#### Port Forwarding Issues

**Symptoms:**
- Can't access applications from outside cluster

**Solutions:**

```bash
# Port forward control plane
kubectl port-forward --address 0.0.0.0 service/control-plane-service 8000:8000 -n control-plane

# Port forward tenant app
kubectl port-forward --address 0.0.0.0 service/tenant-{slug} 8000:8000 -n tenant-{slug}

# Check if ports are accessible
curl http://localhost:8000/api/v1/health/
```

### 6. Provisioning Issues

#### Celery Task Failures

**Symptoms:**
- Provisioning jobs stuck in "running" state
- Error messages in provisioning logs

**Solutions:**

```bash
# Check Celery logs
kubectl logs -f deployment/control-plane -n control-plane | grep celery

# Check Redis connection
kubectl exec -it deployment/redis -n control-plane -- redis-cli ping

# Check provisioning job status
curl http://netsentinel.local/api/v1/provisioner/status/

# Restart Celery workers
kubectl rollout restart deployment/control-plane -n control-plane
```

#### Helm Chart Issues

**Symptoms:**
- Helm deployment fails
- Template rendering errors

**Solutions:**

```bash
# Validate Helm chart
helm lint tenant_app/helm/

# Dry run deployment
helm install tenant-test tenant_app/helm/ --dry-run --debug

# Check Helm values
helm get values tenant-{slug} -n tenant-{slug}

# Upgrade deployment
helm upgrade tenant-{slug} tenant_app/helm/ -n tenant-{slug}
```

### 7. Resource and Performance Issues

#### Resource Exhaustion

**Symptoms:**
- Pods being evicted
- Slow application performance

**Solutions:**

```bash
# Check resource usage
kubectl top pods --all-namespaces
kubectl top nodes

# Check resource quotas
kubectl describe resourcequota --all-namespaces

# Check pod resource requests
kubectl describe pod -n tenant-{slug} | grep -A 5 "Requests:"

# Increase resource limits
helm upgrade tenant-{slug} tenant_app/helm/ -n tenant-{slug} \
  --set resources.limits.cpu=1000m \
  --set resources.limits.memory=2Gi
```

#### Storage Issues

**Symptoms:**
- Persistent volume claims failing
- Database storage full

**Solutions:**

```bash
# Check storage classes
kubectl get storageclass

# Check persistent volumes
kubectl get pv
kubectl get pvc --all-namespaces

# Check disk usage
kubectl exec -it deployment/postgres -n control-plane -- df -h

# Clean up old data
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "VACUUM FULL;"
```

## Debugging Commands

### General Debugging

```bash
# Get detailed pod information
kubectl describe pod {pod-name} -n {namespace}

# Get pod logs
kubectl logs -f {pod-name} -n {namespace}

# Get events
kubectl get events -n {namespace} --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pod {pod-name} -n {namespace}
kubectl top node
```

### Application-Specific Debugging

```bash
# Control plane debugging
kubectl exec -it deployment/control-plane -n control-plane -- /bin/bash
kubectl logs -f deployment/control-plane -n control-plane

# Tenant app debugging
kubectl exec -it deployment/tenant-{slug} -n tenant-{slug} -- /bin/bash
kubectl logs -f deployment/tenant-{slug} -n tenant-{slug}

# Database debugging
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres
kubectl logs -f deployment/postgres -n control-plane
```

### Network Debugging

```bash
# Check network policies
kubectl get networkpolicies --all-namespaces

# Test connectivity
kubectl exec -it deployment/control-plane -n control-plane -- curl http://postgres-service.control-plane.svc.cluster.local:5432

# Check DNS resolution
kubectl exec -it deployment/control-plane -n control-plane -- nslookup postgres-service.control-plane.svc.cluster.local
```

## Recovery Procedures

### Complete System Reset

```bash
# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete

# Restart Minikube
minikube start --memory=8192 --cpus=4 --disk-size=20g

# Re-enable addons
minikube addons enable ingress
minikube addons enable ingress-dns
minikube addons enable storage-provisioner
minikube addons enable metrics-server

# Redeploy infrastructure
kubectl apply -f infrastructure/postgres/deploy.yaml
kubectl apply -f infrastructure/redis/deploy.yaml
kubectl apply -f infrastructure/ingress/config.yaml

# Redeploy applications
kubectl apply -f control_plane/k8s/deployment.yaml
```

### Tenant Recovery

```bash
# Delete failed tenant
kubectl delete namespace tenant-{slug}

# Clean up database
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "DROP DATABASE IF EXISTS tenant_{slug}; DROP USER IF EXISTS tenant_{slug};"

# Redeploy tenant
helm install tenant-{slug} tenant_app/helm/ -n tenant-{slug} --values values.yaml
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs**: Always start with application logs
2. **Verify configuration**: Ensure all environment variables and secrets are correct
3. **Check resources**: Verify sufficient CPU, memory, and storage
4. **Test connectivity**: Ensure network connectivity between components
5. **Review documentation**: Check the setup guide and provisioning guide
6. **Create an issue**: If the problem persists, create a GitHub issue with:
   - Detailed error messages
   - Steps to reproduce
   - System information (OS, Minikube version, etc.)
   - Relevant logs and configuration



