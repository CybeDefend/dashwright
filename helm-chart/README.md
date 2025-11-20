# Dashwright Helm Chart

[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/dashwright)](https://artifacthub.io/packages/search?repo=dashwright)

A modern Playwright dashboard for visualizing test runs, artifacts, and CI/CD integration.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure (for PostgreSQL and MinIO persistence)

## Installing the Chart

### Add the Helm repository

```bash
helm repo add dashwright https://cybedefend.github.io/dashwright
helm repo update
```

### Install the chart

```bash
# Basic installation
helm install dashwright dashwright/dashwright

# Installation with custom values
helm install dashwright dashwright/dashwright -f my-values.yaml

# Installation in a specific namespace
helm install dashwright dashwright/dashwright --namespace dashwright --create-namespace
```

## Uninstalling the Chart

```bash
helm uninstall dashwright
```

## Configuration

The following table lists the configurable parameters of the Dashwright chart and their default values.

### Global Parameters

| Parameter               | Description                 | Default |
| ----------------------- | --------------------------- | ------- |
| `replicaCount.backend`  | Number of backend replicas  | `1`     |
| `replicaCount.frontend` | Number of frontend replicas | `1`     |
| `nameOverride`          | Override chart name         | `""`    |
| `fullnameOverride`      | Override full name          | `""`    |

### Image Parameters

| Parameter                   | Description                | Default                                  |
| --------------------------- | -------------------------- | ---------------------------------------- |
| `image.backend.repository`  | Backend image repository   | `ghcr.io/cybedefend/dashwright/backend`  |
| `image.backend.tag`         | Backend image tag          | `1.0.19`                                 |
| `image.backend.pullPolicy`  | Backend image pull policy  | `Always`                                 |
| `image.frontend.repository` | Frontend image repository  | `ghcr.io/cybedefend/dashwright/frontend` |
| `image.frontend.tag`        | Frontend image tag         | `1.0.19`                                 |
| `image.frontend.pullPolicy` | Frontend image pull policy | `Always`                                 |

### Service Parameters

| Parameter               | Description           | Default     |
| ----------------------- | --------------------- | ----------- |
| `service.backend.type`  | Backend service type  | `ClusterIP` |
| `service.backend.port`  | Backend service port  | `3000`      |
| `service.frontend.type` | Frontend service type | `ClusterIP` |
| `service.frontend.port` | Frontend service port | `80`        |

### Ingress Parameters

| Parameter                | Description         | Default            |
| ------------------------ | ------------------- | ------------------ |
| `ingress.enabled`        | Enable ingress      | `false`            |
| `ingress.className`      | Ingress class name  | `""`               |
| `ingress.annotations`    | Ingress annotations | `{}`               |
| `ingress.hosts[0].host`  | Hostname            | `dashwright.local` |
| `ingress.hosts[0].paths` | Path configuration  | See values.yaml    |
| `ingress.tls`            | TLS configuration   | `[]`               |

### PostgreSQL Parameters

| Parameter                                | Description                                    | Default                         |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------- |
| `postgresql.enabled`                     | Enable PostgreSQL subchart                     | `true`                          |
| `postgresql.auth.username`               | Database username                              | `dashwright`                    |
| `postgresql.auth.password`               | Database password                              | `changeme`                      |
| `postgresql.auth.database`               | Database name                                  | `dashwright`                    |
| `postgresql.primary.persistence.enabled` | Enable persistence                             | `true`                          |
| `postgresql.primary.persistence.size`    | Persistent volume size                         | `10Gi`                          |
| `postgresql.external.host`               | External PostgreSQL host (when enabled: false) | `external-postgres.example.com` |
| `postgresql.external.port`               | External PostgreSQL port                       | `5432`                          |
| `postgresql.external.username`           | External database username                     | `dashwright`                    |
| `postgresql.external.password`           | External database password                     | `changeme`                      |
| `postgresql.external.database`           | External database name                         | `dashwright`                    |

### Storage Parameters (S3-compatible)

| Parameter           | Description                                                               | Default                |
| ------------------- | ------------------------------------------------------------------------- | ---------------------- |
| `storage.endpoint`  | S3 endpoint URL (leave empty for AWS S3, set for S3-compatible providers) | `""`                   |
| `storage.region`    | AWS region (only used for AWS S3, ignored for custom endpoints)           | `us-east-1`            |
| `storage.accessKey` | S3 access key (used when `minio.enabled=false`)                           | `""`                   |
| `storage.secretKey` | S3 secret key (used when `minio.enabled=false`)                           | `""`                   |
| `storage.bucket`    | S3 bucket name                                                            | `dashwright-artifacts` |

### MinIO Parameters

| Parameter                   | Description               | Default                |
| --------------------------- | ------------------------- | ---------------------- |
| `minio.enabled`             | Enable internal MinIO     | `true`                 |
| `minio.auth.rootUser`       | MinIO root user           | `minioadmin`           |
| `minio.auth.rootPassword`   | MinIO root password       | `minioadmin`           |
| `minio.persistence.enabled` | Enable persistence        | `true`                 |
| `minio.persistence.size`    | Persistent volume size    | `50Gi`                 |
| `minio.defaultBuckets`      | Default buckets to create | `dashwright-artifacts` |

### Resource Limits

| Parameter                           | Description            | Default |
| ----------------------------------- | ---------------------- | ------- |
| `resources.backend.limits.cpu`      | Backend CPU limit      | `1000m` |
| `resources.backend.limits.memory`   | Backend memory limit   | `1Gi`   |
| `resources.backend.requests.cpu`    | Backend CPU request    | `250m`  |
| `resources.backend.requests.memory` | Backend memory request | `512Mi` |
| `resources.frontend.limits.cpu`     | Frontend CPU limit     | `500m`  |
| `resources.frontend.limits.memory`  | Frontend memory limit  | `512Mi` |

### Autoscaling

| Parameter                                    | Description            | Default |
| -------------------------------------------- | ---------------------- | ------- |
| `autoscaling.enabled`                        | Enable autoscaling     | `false` |
| `autoscaling.minReplicas`                    | Minimum replicas       | `1`     |
| `autoscaling.maxReplicas`                    | Maximum replicas       | `10`    |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization | `80`    |

### Environment Variables

Backend environment variables can be configured under `env.backend`, and frontend variables under `env.frontend`.

## Examples

### Using External PostgreSQL

```yaml
postgresql:
  enabled: false
  external:
    host: "my-postgres.example.com"
    port: 5432
    username: "dashwright"
    password: "secure-password"
    database: "dashwright"
```

### Using AWS S3 Storage

```yaml
# Disable MinIO (using AWS S3 instead)
minio:
  enabled: false

# Configure AWS S3
storage:
  endpoint: "" # Empty for AWS S3 (uses default AWS endpoints)
  region: "us-east-1"
  accessKey: "AKIAIOSFODNN7EXAMPLE"
  secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  bucket: "dashwright-artifacts"
```

See `values-aws.yaml` for a complete example.

### Using Scaleway Object Storage

```yaml
# Disable MinIO (using Scaleway instead)
minio:
  enabled: false

# Configure Scaleway S3-compatible storage
# The region is already in the endpoint URL
storage:
  endpoint: "https://s3.fr-par.scw.cloud" # Paris region
  # Other regions:
  #   Amsterdam: https://s3.nl-ams.scw.cloud
  #   Warsaw: https://s3.pl-waw.scw.cloud
  region: "us-east-1" # Default value (ignored for custom endpoints)
  accessKey: "SCWXXXXXXXXXXXXXXXXX"
  secretKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  bucket: "dashwright-artifacts"
```

See `values-scaleway.yaml` for a complete example.

### Using External MinIO or S3-compatible Storage

```yaml
# Disable internal MinIO
minio:
  enabled: false

# Configure external S3-compatible storage
storage:
  endpoint: "https://minio.example.com:9000" # Full endpoint URL
  region: "us-east-1" # Default value (ignored for custom endpoints)
  accessKey: "your-access-key"
  secretKey: "your-secret-key"
  bucket: "dashwright-artifacts"
```

### Using AWS RDS and S3

```yaml
postgresql:
  enabled: false
  external:
    host: "mydb.abc123.us-east-1.rds.amazonaws.com"
    port: 5432
    username: "dashwright"
    password: "your-rds-password"
    database: "dashwright"

minio:
  enabled: false

storage:
  endpoint: "" # Empty for AWS S3
  region: "us-east-1"
  accessKey: "AKIAIOSFODNN7EXAMPLE"
  secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  bucket: "dashwright-artifacts"

env:
  backend:
    JWT_SECRET: "your-jwt-secret"
    JWT_REFRESH_SECRET: "your-refresh-secret"
```

### Enable Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### Custom Domain with TLS

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: dashwright.yourdomain.com
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
        - dashwright.yourdomain.com

env:
  frontend:
    VITE_API_URL: "https://dashwright.yourdomain.com/api"
    VITE_WS_URL: "wss://dashwright.yourdomain.com"
```

## Quick Start with Custom Values

Create a `custom-values.yaml` file to customize your deployment:

```yaml
# Enable ingress with your domain
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: dashwright.yourcompany.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend

# Use internal PostgreSQL (enabled by default)
postgresql:
  enabled: true
  auth:
    password: your-secure-database-password

# Use internal MinIO (enabled by default)
minio:
  enabled: true
  auth:
    rootPassword: your-secure-minio-password

# Configure JWT secrets
env:
  backend:
    JWT_SECRET: your-very-long-and-secure-jwt-secret
    JWT_REFRESH_SECRET: your-very-long-and-secure-refresh-secret
```

Deploy with your custom values:

```bash
helm install dashwright dashwright/dashwright -f custom-values.yaml
```

### With External S3 Storage

For production deployments, use external S3-compatible storage:

```yaml
# Disable internal MinIO
minio:
  enabled: false

# Configure external S3 storage
storage:
  endpoint: "https://s3.fr-par.scw.cloud" # Or your S3 endpoint
  region: "us-east-1"
  accessKey: "your-s3-access-key"
  secretKey: "your-s3-secret-key"
  bucket: "dashwright-artifacts"

# Other configuration...
ingress:
  enabled: true
  hosts:
    - host: dashwright.yourcompany.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend

postgresql:
  auth:
    password: your-secure-database-password

env:
  backend:
    JWT_SECRET: your-very-long-and-secure-jwt-secret
    JWT_REFRESH_SECRET: your-very-long-and-secure-refresh-secret
```

## Security Considerations

⚠️ **Important**: The default values include insecure passwords and secrets. Always override these in production:

```yaml
postgresql:
  auth:
    password: "your-secure-database-password"

minio:
  auth:
    rootUser: "admin"
    rootPassword: "your-secure-minio-password"

storage:
  accessKey: "your-s3-access-key"
  secretKey: "your-s3-secret-key"

env:
  backend:
    JWT_SECRET: "your-very-long-and-secure-jwt-secret"
    JWT_REFRESH_SECRET: "your-very-long-and-secure-refresh-secret"
```

## Secrets Management

The chart automatically manages Kubernetes secrets for database and storage credentials:

### Internal PostgreSQL (default)

When `postgresql.enabled: true`, the chart uses the Bitnami PostgreSQL subchart which automatically creates a secret named `<release-name>-postgresql` containing the database password.

### External PostgreSQL

When `postgresql.enabled: false`, the chart creates a secret named `<release-name>-postgresql` with the password from `postgresql.external.password`:

```yaml
postgresql:
  enabled: false
  external:
    host: "my-postgres.example.com"
    port: 5432
    username: "dashwright"
    password: "secure-password"  # This will be stored in a Kubernetes secret
    database: "dashwright"
```

### Internal MinIO (default)

When `minio.enabled: true`, the Bitnami MinIO subchart creates a secret named `<release-name>-minio` with the root password.

### External S3/MinIO

When `minio.enabled: false`, the chart creates a secret named `<release-name>-minio` with the storage secret key from `storage.secretKey`:

```yaml
minio:
  enabled: false

storage:
  endpoint: "https://s3.amazonaws.com"
  region: "us-east-1"
  accessKey: "AKIAIOSFODNN7EXAMPLE"
  secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  # Stored in secret
  bucket: "dashwright-artifacts"
```

### Using Existing Secrets

If you prefer to manage secrets externally (e.g., with External Secrets Operator, Sealed Secrets, or Vault), you can create secrets with the expected names and keys:

```yaml
# For PostgreSQL
apiVersion: v1
kind: Secret
metadata:
  name: <release-name>-postgresql
type: Opaque
stringData:
  password: "your-database-password"

---
# For MinIO/S3
apiVersion: v1
kind: Secret
metadata:
  name: <release-name>-minio
type: Opaque
stringData:
  root-password: "your-storage-secret-key"
```

Then deploy the chart, and it will use your pre-existing secrets instead of creating new ones.

## Troubleshooting

### Check pod status

```bash
kubectl get pods -l app.kubernetes.io/name=dashwright
```

### View logs

```bash
# Backend logs
kubectl logs -l app.kubernetes.io/component=backend -f

# Frontend logs
kubectl logs -l app.kubernetes.io/component=frontend -f
```

### Check services

```bash
kubectl get svc -l app.kubernetes.io/name=dashwright
```

### Describe resources

```bash
kubectl describe deployment -l app.kubernetes.io/name=dashwright
```

## License

Apache License 2.0 - see [LICENSE](https://github.com/CybeDefend/dashwright/blob/main/LICENSE) file for details

## Links

- **GitHub Repository**: https://github.com/CybeDefend/dashwright
- **Issue Tracker**: https://github.com/CybeDefend/dashwright/issues
- **Discussions**: https://github.com/CybeDefend/dashwright/discussions
