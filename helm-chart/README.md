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

### MinIO Parameters

| Parameter                   | Description                                | Default                |
| --------------------------- | ------------------------------------------ | ---------------------- |
| `minio.enabled`             | Enable MinIO subchart                      | `true`                 |
| `minio.auth.rootUser`       | MinIO root user                            | `minioadmin`           |
| `minio.auth.rootPassword`   | MinIO root password                        | `minioadmin`           |
| `minio.persistence.enabled` | Enable persistence                         | `true`                 |
| `minio.persistence.size`    | Persistent volume size                     | `50Gi`                 |
| `minio.defaultBuckets`      | Default buckets to create                  | `dashwright-artifacts` |
| `minio.external.endpoint`   | External S3 endpoint (when enabled: false) | `s3.amazonaws.com`     |
| `minio.external.port`       | External S3 port                           | `443`                  |
| `minio.external.useSSL`     | Use SSL for external S3                    | `true`                 |
| `minio.external.accessKey`  | External S3 access key                     | `your-access-key`      |
| `minio.external.secretKey`  | External S3 secret key                     | `your-secret-key`      |
| `minio.external.bucket`     | External S3 bucket name                    | `dashwright-artifacts` |

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

### Using External S3-compatible Storage (AWS S3, MinIO, etc.)

```yaml
minio:
  enabled: false
  external:
    endpoint: "s3.amazonaws.com"
    port: 443
    useSSL: true
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
  external:
    endpoint: "s3.us-east-1.amazonaws.com"
    port: 443
    useSSL: true
    accessKey: "AKIAIOSFODNN7EXAMPLE"
    secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    bucket: "my-dashwright-bucket"
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
