# 📦 Storage Configuration

Dashwright uses **S3-compatible storage** for test artifacts (screenshots, videos, traces, and logs). Since the backend uses the AWS SDK for JavaScript v3, it works seamlessly with any S3-compatible provider.

## Supported Providers

✅ **Any S3-compatible storage**, including:
- **MinIO** - Self-hosted (perfect for local development)
- **AWS S3** - Amazon's native object storage
- **Scaleway Object Storage** - European alternative
- **DigitalOcean Spaces** - Simple cloud storage
- **Backblaze B2** - Cost-effective cloud storage
- **Wasabi** - Fast cloud storage
- And many more!

## How It Works

All you need is:
1. An **endpoint URL** (or leave empty for AWS S3)
2. An **access key** and **secret key**
3. A **region** (e.g., `us-east-1`, `fr-par`)
4. A **bucket name**

## Quick Start

### Environment Variables

```bash
# S3 Endpoint (leave empty for AWS S3, include region for S3-compatible providers)
# Examples:
#   MinIO: http://localhost:9000
#   Scaleway: https://s3.fr-par.scw.cloud (region already in URL)
#   AWS S3: (empty, uses default AWS endpoints)
STORAGE_ENDPOINT=http://localhost:9000

# Region (optional, only needed for AWS S3)
# For S3-compatible providers, the region is already in the endpoint URL
STORAGE_REGION=us-east-1

# Credentials
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin

# Bucket Configuration
STORAGE_BUCKET=dashwright-artifacts
STORAGE_LIMIT_GB=100
```

---

## Provider Examples

### MinIO (Local Development)

Perfect for local development and self-hosted deployments.

#### Docker Compose

```yaml
version: "3.8"

services:
  minio:
    image: minio/minio:latest
    container_name: dashwright-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console
    volumes:
      - minio_data:/data

  backend:
    image: ghcr.io/cybedefend/dashwright/backend:latest
    environment:
      STORAGE_ENDPOINT: http://minio:9000
      STORAGE_REGION: us-east-1
      STORAGE_ACCESS_KEY: minioadmin
      STORAGE_SECRET_KEY: minioadmin
      STORAGE_BUCKET: dashwright-artifacts
      # ... other env vars
    depends_on:
      - minio

volumes:
  minio_data:
```

#### Standalone MinIO

```bash
# .env
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=dashwright-artifacts
```

**Access MinIO Console**: http://localhost:9001

---

### AWS S3

Use Amazon's native S3 service.

#### IAM Permissions

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:CreateBucket",
        "s3:HeadBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

#### Configuration

```bash
# .env
# Leave STORAGE_ENDPOINT empty for AWS S3
STORAGE_ENDPOINT=

STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_BUCKET=dashwright-artifacts
STORAGE_LIMIT_GB=100
```

#### Docker Compose (No MinIO needed)

```yaml
version: "3.8"

services:
  backend:
    image: ghcr.io/cybedefend/dashwright/backend:latest
    environment:
      # No STORAGE_ENDPOINT for AWS S3
      STORAGE_REGION: us-east-1
      STORAGE_ACCESS_KEY: ${AWS_ACCESS_KEY_ID}
      STORAGE_SECRET_KEY: ${AWS_SECRET_ACCESS_KEY}
      STORAGE_BUCKET: dashwright-artifacts
      # ... other env vars
```

---

### Scaleway Object Storage

European S3-compatible cloud storage.

#### Get Credentials

1. Go to https://console.scaleway.com/project/credentials
2. Generate API Key (Access Key + Secret Key)
3. Note your preferred region: `fr-par`, `nl-ams`, or `pl-waw`

#### Configuration

```bash
# .env
# The endpoint already contains the region (fr-par, nl-ams, pl-waw)
STORAGE_ENDPOINT=https://s3.fr-par.scw.cloud
STORAGE_ACCESS_KEY=your-scaleway-access-key
STORAGE_SECRET_KEY=your-scaleway-secret-key
STORAGE_BUCKET=dashwright-artifacts
STORAGE_LIMIT_GB=100

# STORAGE_REGION is optional (ignored when using custom endpoint)
```

#### Available Regions

| Region | Endpoint (region already included) |
|--------|----------|
| Paris | `https://s3.fr-par.scw.cloud` |
| Amsterdam | `https://s3.nl-ams.scw.cloud` |
| Warsaw | `https://s3.pl-waw.scw.cloud` |

#### Docker Compose

```yaml
backend:
  image: ghcr.io/cybedefend/dashwright/backend:latest
  environment:
    STORAGE_ENDPOINT: https://s3.fr-par.scw.cloud
    STORAGE_REGION: fr-par
    STORAGE_ACCESS_KEY: ${SCALEWAY_ACCESS_KEY}
    STORAGE_SECRET_KEY: ${SCALEWAY_SECRET_KEY}
    STORAGE_BUCKET: dashwright-artifacts
```

---

### DigitalOcean Spaces

Simple and affordable S3-compatible storage.

#### Get Credentials

1. Go to https://cloud.digitalocean.com/account/api/spaces
2. Generate a Spaces access key
3. Choose your region

#### Configuration

```bash
# .env
STORAGE_ENDPOINT=https://nyc3.digitaloceanspaces.com
STORAGE_REGION=nyc3
STORAGE_ACCESS_KEY=your-spaces-access-key
STORAGE_SECRET_KEY=your-spaces-secret-key
STORAGE_BUCKET=dashwright-artifacts
```

#### Available Regions

| Region | Endpoint |
|--------|----------|
| New York 3 | `https://nyc3.digitaloceanspaces.com` |
| San Francisco 3 | `https://sfo3.digitaloceanspaces.com` |
| Amsterdam 3 | `https://ams3.digitaloceanspaces.com` |
| Singapore 1 | `https://sgp1.digitaloceanspaces.com` |
| Frankfurt 1 | `https://fra1.digitaloceanspaces.com` |

---

### Backblaze B2

Cost-effective cloud storage with S3-compatible API.

#### Get Credentials

1. Go to https://secure.backblaze.com/app_keys.htm
2. Create an Application Key with S3 capabilities
3. Note your bucket endpoint

#### Configuration

```bash
# .env
# The endpoint already contains the region identifier
STORAGE_ENDPOINT=https://s3.us-west-004.backblazeb2.com
STORAGE_ACCESS_KEY=your-b2-key-id
STORAGE_SECRET_KEY=your-b2-application-key
STORAGE_BUCKET=dashwright-artifacts
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGE_ENDPOINT` | **Yes** (for S3-compatible)<br>No (for AWS S3) | (empty) | Full S3 endpoint URL including region. Leave empty for AWS S3. Examples:<br>• MinIO: `http://localhost:9000`<br>• Scaleway: `https://s3.fr-par.scw.cloud`<br>• DigitalOcean: `https://nyc3.digitaloceanspaces.com` |
| `STORAGE_REGION` | No | `us-east-1` | **Only required for AWS S3** to specify the region (e.g., `us-east-1`, `eu-west-1`). For S3-compatible providers, the region is already in the endpoint URL and this value is ignored. |
| `STORAGE_ACCESS_KEY` | Yes | `minioadmin` | S3 access key ID |
| `STORAGE_SECRET_KEY` | Yes | `minioadmin` | S3 secret access key |
| `STORAGE_BUCKET` | Yes | `dashwright-artifacts` | S3 bucket name (will be created if doesn't exist) |
| `STORAGE_LIMIT_GB` | No | `100` | Storage quota in GB (used for dashboard display) |

---

## Kubernetes / Helm Configuration

### Using Built-in MinIO

```yaml
# values.yaml
minio:
  enabled: true

storage:
  endpoint: ""  # Uses internal MinIO service
  region: "us-east-1"
  accessKey: "minioadmin"
  secretKey: "minioadmin"
  bucket: "dashwright-artifacts"
  limitGB: 100
```

### Using External S3 (AWS)

```yaml
# values.yaml
minio:
  enabled: false

storage:
  endpoint: ""  # Empty for AWS S3
  region: "us-east-1"
  accessKey: "AKIAIOSFODNN7EXAMPLE"
  secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  bucket: "dashwright-artifacts"
  limitGB: 500
```

### Using Scaleway

```yaml
# values.yaml
minio:
  enabled: false

storage:
  endpoint: "https://s3.fr-par.scw.cloud"
  region: "fr-par"
  accessKey: "your-scaleway-access-key"
  secretKey: "your-scaleway-secret-key"
  bucket: "dashwright-artifacts"
  limitGB: 250
```

---

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to storage
```
Error: getaddrinfo ENOTFOUND minio
```

**Solutions**:
- For MinIO in Docker: Use `http://minio:9000` (not `localhost`)
- For external services: Include `https://` in endpoint
- Check firewall rules and network connectivity

### Authentication Errors

**Problem**: Access denied
```
Error: The request signature we calculated does not match
```

**Solutions**:
- Verify access key and secret key are correct
- Check IAM permissions for AWS S3
- Ensure credentials are valid and not expired

### Bucket Not Found

**Problem**: Bucket doesn't exist
```
Error: The specified bucket does not exist
```

**Solution**: Dashwright will try to create the bucket automatically. Ensure your credentials have `CreateBucket` permission, or create the bucket manually.

### Force Path Style

The backend uses `forcePathStyle: true` which is required for:
- MinIO
- Some S3-compatible providers
- AWS S3 buckets created before 2020

This is already configured and works for all providers.

---

## Migration Between Providers

Use `rclone` to migrate artifacts between storage providers:

### Install rclone

```bash
# macOS
brew install rclone

# Linux
curl https://rclone.org/install.sh | sudo bash

# Windows
choco install rclone
```

### Configure Source (MinIO)

```bash
rclone config

# Choose: New remote > name: "source"
# Storage: s3
# Provider: Other
# Access Key: minioadmin
# Secret Key: minioadmin
# Endpoint: http://localhost:9000
```

### Configure Destination (Scaleway)

```bash
rclone config

# Choose: New remote > name: "dest"
# Storage: s3
# Provider: Other
# Access Key: your-scaleway-key
# Secret Key: your-scaleway-secret
# Endpoint: https://s3.fr-par.scw.cloud
```

### Migrate Data

```bash
# Sync all artifacts
rclone sync source:dashwright-artifacts dest:dashwright-artifacts -P

# Dry run first (recommended)
rclone sync source:dashwright-artifacts dest:dashwright-artifacts --dry-run -v
```

---

## Best Practices

1. **Use environment variables** for credentials (never commit secrets)
2. **Enable bucket versioning** for production (if supported by provider)
3. **Set up backup policies** for critical artifacts
4. **Monitor storage usage** through the Dashwright dashboard
5. **Use lifecycle policies** to auto-delete old artifacts (if supported)
6. **Choose a provider close to your users** for faster artifact loading
7. **Consider costs** - pricing varies significantly between providers

---

## Security

- Never commit credentials to version control
- Use IAM roles when possible (AWS ECS/EKS)
- Rotate access keys regularly
- Apply principle of least privilege to S3 permissions
- Enable S3 bucket encryption (server-side encryption)
- Use HTTPS endpoints for cloud providers
- Consider using Kubernetes secrets for credentials in production

---

## Need Help?

- 📖 [Official Documentation](https://github.com/CybeDefend/dashwright)
- 💬 [GitHub Discussions](https://github.com/CybeDefend/dashwright/discussions)
- 🐛 [Report an Issue](https://github.com/CybeDefend/dashwright/issues)
