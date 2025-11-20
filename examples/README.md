# Docker Compose Examples

This directory contains example Docker Compose configurations for different S3-compatible storage providers.

**Note**: All examples use the same S3-compatible backend. The only difference is the endpoint configuration.

## Available Examples

### 1. MinIO (Default - Self-hosted)
**File**: `docker-compose.minio.yml`

Self-hosted S3-compatible storage. Perfect for local development or private deployments.

```bash
docker compose -f docker-compose.minio.yml up -d
```

**Access MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)

### 2. AWS S3
**File**: `docker-compose.aws-s3.yml`

Native Amazon S3 cloud storage. No MinIO container needed.

```bash
# Set your AWS credentials
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key

docker compose -f docker-compose.aws-s3.yml up -d
```

### 3. Scaleway Object Storage
**File**: `docker-compose.scaleway-s3.yml`

European S3-compatible cloud storage (Paris, Amsterdam, Warsaw).

```bash
# Set your Scaleway credentials
export SCALEWAY_ACCESS_KEY=your-access-key
export SCALEWAY_SECRET_KEY=your-secret-key

docker compose -f docker-compose.scaleway-s3.yml up -d
```

## Environment Variables

Each example can be customized with environment variables. Create a `.env` file:

```bash
# Copy the appropriate example
cp ../.env.example .env

# Edit with your configuration
nano .env
```

## More Information

For detailed storage configuration, see [STORAGE.md](../STORAGE.md)
