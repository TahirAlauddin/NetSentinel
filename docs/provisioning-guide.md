# NetSentinel Manual Provisioning Guide

This guide walks you through manually provisioning a tenant in the NetSentinel system.

## Prerequisites

- Minikube cluster running with all infrastructure deployed
- Control plane application deployed and accessible
- kubectl and helm configured

## Step-by-Step Provisioning Process

### 1. Verify Infrastructure Status

```bash
# Check all pods are running
kubectl get pods --all-namespaces

# Verify services
kubectl get services --all-namespaces

# Check ingress
kubectl get ingress --all-namespaces
```

### 2. Create Tenant via Control Plane API (Example)

TODO: Update with actual API when available

```bash
# Create a new tenant
curl -X POST http://netsentinel.local/api/v1/tenants/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme",
    "subdomain": "acme",
    "primary_admin_email": "admin@acme.com",
    "primary_admin_name": "John Doe",
    "company_email": "contact@acme.com",
    "company_phone": "+1-555-0123",
    "plan": "starter",
    "billing_email": "billing@acme.com",
    "max_users": 25,
    "max_storage_gb": 10
  }'
```

Expected response:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Acme Corporation",
  "slug": "acme",
  "subdomain": "acme",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 3. Monitor Provisioning Progress

TODO: Update with actual API when available

```bash
# Check provisioning status
curl http://netsentinel.local/api/v1/provisioner/status/

# Get specific tenant status
curl http://netsentinel.local/api/v1/tenants/{tenant-id}/status/
```

### 4. Manual Provisioning Steps (if automated provisioning fails)

TODO: Update with actual steps when available

#### Step 4.1: Create Database

```bash
# Connect to PostgreSQL
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres

# Create database and user
CREATE DATABASE "tenant_acme";
CREATE USER "tenant_acme" WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE "tenant_acme" TO "tenant_acme";
\q
```

#### Step 4.2: Create Kubernetes Namespace

```bash
# Create namespace
kubectl create namespace tenant-acme

# Create resource quota
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-resource-quota
  namespace: tenant-acme
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "10"
    pods: "20"
    services: "10"
EOF
```

#### Step 4.3: Create Secrets

TODO: Update with actual steps when available

```bash
# Create tenant secrets
kubectl create secret generic tenant-acme-secrets \
  --namespace=tenant-acme \
  --from-literal=secret-key="tenant-secret-key-change-me" \
  --from-literal=db-name="tenant_acme" \
  --from-literal=db-user="tenant_acme" \
  --from-literal=db-password="secure_password_here"
```

#### Step 4.4: Deploy Tenant Application

TODO: Update with actual steps when available

```bash
# Deploy using Helm
helm install tenant-acme tenant_app/helm/ \
  --namespace tenant-acme \
  --set tenant.id="123e4567-e89b-12d3-a456-426614174000" \
  --set tenant.name="Acme Corporation" \
  --set tenant.slug="acme" \
  --set tenant.subdomain="acme" \
  --set database.name="tenant_acme" \
  --set database.user="tenant_acme" \
  --set database.password="secure_password_here" \
  --set app.secretKey="tenant-secret-key-change-me" \
  --set app.allowedHosts="acme.netsentinel.local" \
  --set ingress.hosts[0].host="acme.netsentinel.local"
```

#### Step 4.5: Run Database Migrations

TODO: Update with actual steps when available

```bash
# Get pod name
POD_NAME=$(kubectl get pods -n tenant-acme -l app=tenant-app -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n tenant-acme $POD_NAME -- python manage.py migrate

# Create admin user
kubectl exec -n tenant-acme $POD_NAME -- python manage.py createsuperuser \
  --email admin@acme.com \
  --username admin
```

### 5. Verify Tenant Deployment

TODO: Update with actual steps when available

```bash
# Check pod status
kubectl get pods -n tenant-acme

# Check service
kubectl get service -n tenant-acme

# Check ingress
kubectl get ingress -n tenant-acme

# Test health endpoint
curl http://acme.netsentinel.local/api/v1/health/
```

### 6. Access Tenant Application

1. **Open browser**: Navigate to `http://acme.netsentinel.local`
2. **Login**: Use the admin credentials created in step 4.5
3. **Verify functionality**: Test user creation, ticket creation, etc.

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check database pod
kubectl get pods -n control-plane -l app=postgres

# Check database logs
kubectl logs -f deployment/postgres -n control-plane

# Test database connection
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "\l"
```

#### Pod Startup Issues

```bash
# Check pod status
kubectl describe pod -n tenant-acme

# Check pod logs
kubectl logs -f deployment/tenant-acme -n tenant-acme

# Check events
kubectl get events -n tenant-acme --sort-by='.lastTimestamp'
```

#### Ingress Issues

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress -n tenant-acme

# Test DNS resolution
nslookup acme.netsentinel.local
```

#### Resource Quota Issues

```bash
# Check resource usage
kubectl describe resourcequota -n tenant-acme

# Check pod resource requests
kubectl describe pod -n tenant-acme
```

### Cleanup Procedures

#### Delete Tenant

```bash
# Delete Helm release
helm uninstall tenant-acme -n tenant-acme

# Delete namespace (this will delete all resources)
kubectl delete namespace tenant-acme

# Delete database (optional)
kubectl exec -it deployment/postgres -n control-plane -- psql -U postgres -c "DROP DATABASE tenant_acme; DROP USER tenant_acme;"
```

#### Reset Environment

```bash
# Delete all tenant namespaces
kubectl get namespaces -o name | grep tenant- | xargs kubectl delete

# Reset Minikube
minikube delete
minikube start --memory=8192 --cpus=4 --disk-size=20g
```

## Advanced Configuration

### Custom Resource Limits

```yaml
# values.yaml
resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi
```

### Custom Ingress Configuration

```yaml
# values.yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
  hosts:
    - host: acme.netsentinel.local
      paths:
        - path: /
          pathType: Prefix
```

### Environment Variables

```bash
# Set custom environment variables
helm install tenant-acme tenant_app/helm/ \
  --namespace tenant-acme \
  --set-string app.debug="True" \
  --set-string app.allowedHosts="acme.netsentinel.local,localhost" \
  --set-string tenant.id="123e4567-e89b-12d3-a456-426614174000"
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check all tenant health
for ns in $(kubectl get namespaces -o name | grep tenant-); do
  echo "Checking $ns"
  kubectl get pods -n ${ns#namespace/} -l app=tenant-app
done
```

### Log Aggregation

```bash
# Collect logs from all tenants
for ns in $(kubectl get namespaces -o name | grep tenant-); do
  kubectl logs -n ${ns#namespace/} -l app=tenant-app --tail=100
done
```

### Resource Monitoring

```bash
# Check resource usage across all tenants
kubectl top pods --all-namespaces | grep tenant-
```

## Security Considerations

1. **Database Credentials**: Use strong, unique passwords for each tenant
2. **Secret Management**: Rotate secrets regularly
3. **Network Policies**: Ensure proper namespace isolation
4. **Resource Limits**: Set appropriate CPU and memory limits
5. **Access Control**: Implement proper RBAC for tenant access

## Next Steps

After successful provisioning:

1. **Configure Monitoring**: Set up Prometheus and Grafana for tenant monitoring
2. **Implement Backup**: Configure automated database backups
3. **Setup Logging**: Implement centralized logging with ELK stack
4. **Security Hardening**: Apply security policies and network restrictions
5. **Performance Tuning**: Optimize resource allocation based on usage patterns
