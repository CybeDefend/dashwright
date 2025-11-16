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

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount.backend` | Number of backend replicas | `2` |
| `replicaCount.frontend` | Number of frontend replicas | `2` |
| `nameOverride` | Override chart name | `""` |
| `fullnameOverride` | Override full name | `""` |

### Image Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.backend.repository` | Backend image repository | `dashwright/backend` |
| `image.backend.tag` | Backend image tag | `latest` |
| `image.backend.pullPolicy` | Backend image pull policy | `IfNotPresent` |
| `image.frontend.repository` | Frontend image repository | `dashwright/frontend` |
| `image.frontend.tag` | Frontend image tag | `latest` |
| `image.frontend.pullPolicy` | Frontend image pull policy | `IfNotPresent` |

### Service Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.backend.type` | Backend service type | `ClusterIP` |
| `service.backend.port` | Backend service port | `3000` |
| `service.frontend.type` | Frontend service type | `ClusterIP` |
| `service.frontend.port` | Frontend service port | `80` |

### Ingress Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `nginx` |
| `ingress.hosts[0].host` | Hostname | `dashwright.local` |
| `ingress.tls[0].secretName` | TLS secret name | `dashwright-tls` |

### PostgreSQL Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Enable PostgreSQL subchart | `true` |
| `postgresql.auth.username` | Database username | `dashwright` |
| `postgresql.auth.password` | Database password | `changeme` |
| `postgresql.auth.database` | Database name | `dashwright` |
| `postgresql.primary.persistence.enabled` | Enable persistence | `true` |
| `postgresql.primary.persistence.size` | Persistent volume size | `10Gi` |

### MinIO Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `minio.enabled` | Enable MinIO subchart | `true` |
| `minio.auth.rootUser` | MinIO root user | `minioadmin` |
| `minio.auth.rootPassword` | MinIO root password | `minioadmin` |
| `minio.persistence.enabled` | Enable persistence | `true` |
| `minio.persistence.size` | Persistent volume size | `50Gi` |
| `minio.defaultBuckets` | Default buckets to create | `dashwright-artifacts` |

### Resource Limits

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.backend.limits.cpu` | Backend CPU limit | `1000m` |
| `resources.backend.limits.memory` | Backend memory limit | `1Gi` |
| `resources.backend.requests.cpu` | Backend CPU request | `250m` |
| `resources.backend.requests.memory` | Backend memory request | `512Mi` |
| `resources.frontend.limits.cpu` | Frontend CPU limit | `500m` |
| `resources.frontend.limits.memory` | Frontend memory limit | `512Mi` |

### Autoscaling

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable autoscaling | `false` |
| `autoscaling.minReplicas` | Minimum replicas | `1` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization | `80` |

### Environment Variables

Backend environment variables can be configured under `env.backend`, and frontend variables under `env.frontend`.

## Examples

### Using External PostgreSQL

```yaml
postgresql:
  enabled: false

env:
  backend:
    DB_HOST: "my-postgres.example.com"
    DB_PORT: "5432"
    DB_USERNAME: "dashwright"
    DB_PASSWORD: "secure-password"
    DB_DATABASE: "dashwright"
```

### Using External S3-compatible Storage

```yaml
minio:
  enabled: false

env:
  backend:
    STORAGE_ENDPOINT: "s3.amazonaws.com"
    STORAGE_PORT: "443"
    STORAGE_ACCESS_KEY: "your-access-key"
    STORAGE_SECRET_KEY: "your-secret-key"
    STORAGE_BUCKET: "dashwright-artifacts"
    STORAGE_USE_SSL: "true"
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

env:
  backend:
    JWT_SECRET: "your-very-long-and-secure-jwt-secret"
    JWT_REFRESH_SECRET: "your-very-long-and-secure-refresh-secret"
```

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
