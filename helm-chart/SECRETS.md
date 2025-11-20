# Dashwright - Kubernetes Secrets Examples

This document shows how to create Kubernetes secrets for use with the Dashwright Helm chart.

## Creating Secrets

### 1. PostgreSQL Password Secret

Create a secret containing the PostgreSQL password:

```bash
kubectl create secret generic dashwright-postgresql-password \
  --from-literal=password='your-secure-postgresql-password' \
  --namespace dashwright
```

Then reference it in your `values.yaml`:

```yaml
postgresql:
  enabled: true
  auth:
    username: dashwright
    database: dashwright
    existingSecret: "dashwright-postgresql-password"
```

### 2. S3/Storage Credentials Secret

Create a secret containing S3/MinIO access credentials:

```bash
kubectl create secret generic dashwright-s3-credentials \
  --from-literal=access-key='YOUR_S3_ACCESS_KEY' \
  --from-literal=secret-key='YOUR_S3_SECRET_KEY' \
  --namespace dashwright
```

Then reference it in your `values.yaml`:

```yaml
minio:
  enabled: false

storage:
  endpoint: "https://s3.fr-par.scw.cloud"
  region: "us-east-1"
  bucket: "dashwright-artifacts"
  existingSecret: "dashwright-s3-credentials"
```

### 3. JWT Secrets

Create a secret containing JWT signing keys:

```bash
# Generate secure random strings
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

kubectl create secret generic dashwright-jwt-secrets \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=jwt-refresh-secret="$JWT_REFRESH_SECRET" \
  --namespace dashwright
```

Then reference it in your `values.yaml`:

```yaml
backend:
  jwtExistingSecret: "dashwright-jwt-secrets"

env:
  backend:
    NODE_ENV: production
    # Don't define JWT_SECRET and JWT_REFRESH_SECRET here when using existingSecret
```

## Complete Production Example

Here's a complete example using all existing secrets:

### Step 1: Create all secrets

```bash
# Set your namespace
NAMESPACE=dashwright

# PostgreSQL password
kubectl create secret generic dashwright-postgresql-password \
  --from-literal=password='your-secure-postgresql-password' \
  --namespace $NAMESPACE

# S3 credentials
kubectl create secret generic dashwright-s3-credentials \
  --from-literal=access-key='YOUR_ACCESS_KEY' \
  --from-literal=secret-key='YOUR_SECRET_KEY' \
  --namespace $NAMESPACE

# JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
kubectl create secret generic dashwright-jwt-secrets \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=jwt-refresh-secret="$JWT_REFRESH_SECRET" \
  --namespace $NAMESPACE
```

### Step 2: Create values file

Create `my-production-values.yaml`:

```yaml
# Backend configuration
backend:
  corsOrigin: "https://dashwright.example.com"
  jwtExistingSecret: "dashwright-jwt-secrets"

# Frontend configuration
frontend:
  apiUrl: "https://api-dashwright.example.com"
  wsUrl: "wss://api-dashwright.example.com"

# PostgreSQL with existing secret
postgresql:
  enabled: false
  auth:
    username: dashwright
    database: dashwright
    existingSecret: "dashwright-postgresql-password"
  external:
    host: "postgres.example.com"
    port: 5432

# S3 storage with existing secret
minio:
  enabled: false

storage:
  endpoint: "https://s3.fr-par.scw.cloud"
  region: "us-east-1"
  bucket: "dashwright-artifacts"
  existingSecret: "dashwright-s3-credentials"

# Ingress configuration
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: dashwright.example.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend
  tls:
    - secretName: dashwright-tls
      hosts:
        - dashwright.example.com

# Environment variables (without secrets)
env:
  backend:
    NODE_ENV: production
    PORT: "3000"
    JWT_EXPIRES_IN: "1h"
    JWT_REFRESH_EXPIRES_IN: "7d"
    RATE_LIMIT_TTL: "60"
    RATE_LIMIT_MAX: "10"
```

### Step 3: Install Helm chart

```bash
helm install dashwright dashwright/dashwright \
  --namespace dashwright \
  --create-namespace \
  --values my-production-values.yaml
```

## Verifying Secrets

Check that your secrets are created correctly:

```bash
# List secrets
kubectl get secrets -n dashwright

# View secret (base64 encoded)
kubectl get secret dashwright-postgresql-password -n dashwright -o yaml

# Decode secret value
kubectl get secret dashwright-postgresql-password -n dashwright -o jsonpath='{.data.password}' | base64 -d
```

## Updating Secrets

To update an existing secret:

```bash
# Delete old secret
kubectl delete secret dashwright-postgresql-password -n dashwright

# Create new secret with updated value
kubectl create secret generic dashwright-postgresql-password \
  --from-literal=password='new-secure-password' \
  --namespace dashwright

# Restart pods to pick up new secret
kubectl rollout restart deployment/dashwright-backend -n dashwright
```

## Security Best Practices

1. **Never commit secrets to version control**: Keep your `values.yaml` files without sensitive data
2. **Use strong passwords**: Generate passwords using `openssl rand -base64 32`
3. **Rotate secrets regularly**: Update secrets periodically and restart deployments
4. **Use RBAC**: Limit access to secrets using Kubernetes RBAC
5. **Consider external secret management**: Use tools like:
   - [External Secrets Operator](https://external-secrets.io/)
   - [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
   - [HashiCorp Vault](https://www.vaultproject.io/)
   - Cloud provider secret managers (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)

## Using External Secrets Operator

If you're using External Secrets Operator, you can create ExternalSecret resources:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: dashwright-s3-credentials
  namespace: dashwright
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: my-secret-store
    kind: SecretStore
  target:
    name: dashwright-s3-credentials
    creationPolicy: Owner
  data:
    - secretKey: access-key
      remoteRef:
        key: dashwright/s3/access-key
    - secretKey: secret-key
      remoteRef:
        key: dashwright/s3/secret-key
```
