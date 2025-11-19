# Secrets Management for NetSentinel

This directory contains Kubernetes secrets configuration for the NetSentinel deployment.

## Secret Files

### Option 1: Plain Kubernetes Secrets (`secrets.yaml`)

For direct Kubernetes deployment without Helm:

```powershell
# Review and edit secrets.yaml with your actual passwords
# Then apply:
kubectl apply -f secrets.yaml
```

**⚠️ WARNING:** Do NOT commit actual production secrets to version control!

### Option 2: Helm Values (`values.yaml`)

For Helm-based deployment:

```powershell
# Review and edit values.yaml with your actual passwords
# Then install/upgrade with Helm:
helm install netsentinel . -f values.yaml
# Or for upgrades:
helm upgrade netsentinel . -f values.yaml
```

**⚠️ WARNING:** Do NOT commit actual production secrets to version control!

## Recommended Approach: Environment-Specific Values

Create environment-specific values files that are gitignored:

```powershell
# Create development values (gitignored)
Copy-Item values.yaml values-dev.yaml
# Edit values-dev.yaml with dev credentials

# Create production values (gitignored)  
Copy-Item values.yaml values-prod.yaml
# Edit values-prod.yaml with production credentials

# Deploy with environment-specific values
helm install netsentinel-dev . -f values-dev.yaml
helm install netsentinel-prod . -f values-prod.yaml
```

## Secret Management Best Practices

### For Development/Minikube:
- You can use the default values in `secrets.yaml` or `values.yaml`
- Change passwords before any shared or production use

### For Production:
1. **Use Kubernetes Secrets API:**
   ```powershell
   kubectl create secret generic postgres-secret `
     --from-literal=postgres-password='strong-random-password' `
     --from-literal=postgres-user='netsentinel' `
     --from-literal=postgres-db='netsentinel_db'
   
   kubectl create secret generic django-secret `
     --from-literal=django-secret-key='very-long-random-string-min-50-chars'
   ```

2. **Use External Secrets Operator:**
   - Integrate with AWS Secrets Manager, HashiCorp Vault, etc.
   - See: https://external-secrets.io/

3. **Use Sealed Secrets:**
   - Encrypt secrets for Git storage
   - See: https://github.com/bitnami-labs/sealed-secrets

4. **Use SOPS (Secrets OPerationS):**
   - Encrypt YAML files with age/PGP
   - See: https://github.com/getsops/sops

## Required Secrets

### postgres-secret
- `postgres-password`: Database password (min 12 chars, alphanumeric + special)
- `postgres-user`: Database username (default: `netsentinel`)
- `postgres-db`: Database name (default: `netsentinel_db`)

### django-secret
- `django-secret-key`: Django SECRET_KEY (min 50 chars, random)

## Generating Secure Secrets

### PostgreSQL Password:
```powershell
# PowerShell - Generate random password
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_})
```

### Django Secret Key:
```powershell
# PowerShell - Generate Django secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Verification

After applying secrets, verify they exist:

```powershell
kubectl get secrets
kubectl describe secret postgres-secret
kubectl describe secret django-secret
```

To view (base64 encoded) values:
```powershell
kubectl get secret postgres-secret -o jsonpath='{.data}' | ConvertFrom-Json | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_.Values)) }
```
