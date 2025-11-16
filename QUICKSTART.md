# 🚀 Quick Start Guide

Get up and running with Dashwright in 5 minutes!

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: Using Pre-built Docker Images](#option-1-using-pre-built-docker-images)
- [Option 2: Building from Source](#option-2-building-from-source)
- [Option 3: Development Setup](#option-3-development-setup)
- [First Login](#first-login)
- [Integrate with Playwright](#integrate-with-playwright)
- [Next Steps](#next-steps)

## Prerequisites

Choose one of the following setups:

### For Production (Docker)

- Docker 24.0+
- Docker Compose 2.0+

### For Development

- Node.js 22.14.0+
- pnpm 10.22.0+
- Docker (for PostgreSQL and MinIO)

## Option 1: Using Pre-built Docker Images

**Fastest way to get started!**

### 1. Create docker-compose.yml

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/CybeDefend/dashwright/main/docker-compose.yml
```

Or create it manually:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dashwright
      POSTGRES_USER: dashwright
      POSTGRES_PASSWORD: dashwright
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  backend:
    image: ghcr.io/cybedefend/dashwright/backend:latest
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USERNAME: dashwright
      DATABASE_PASSWORD: dashwright
      DATABASE_NAME: dashwright
      JWT_SECRET: your-super-secret-jwt-key-change-this
      JWT_REFRESH_SECRET: your-super-secret-refresh-key-change-this
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - minio

  frontend:
    image: ghcr.io/cybedefend/dashwright/frontend:latest
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  minio_data:
```

### 2. Authenticate with GitHub Container Registry

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 3. Pull and Start Services

```bash
# Pull images
docker compose pull

# Start services
docker compose up -d

# Check status
docker compose ps
```

### 4. Access the Application

- **Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001

## Option 2: Building from Source

**For latest development version**

### 1. Clone Repository

```bash
git clone https://github.com/CybeDefend/dashwright.git
cd dashwright
```

### 2. Start Services

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f
```

### 3. Access the Application

Same as Option 1.

## Option 3: Development Setup

**For contributors and developers**

### 1. Clone Repository

```bash
git clone https://github.com/CybeDefend/dashwright.git
cd dashwright
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Infrastructure

```bash
# Start only PostgreSQL and MinIO
docker compose up -d postgres minio
```

### 4. Setup Backend

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# DATABASE_HOST=localhost
# JWT_SECRET=your-secret-key
# etc.

# Run migrations
pnpm run migration:run

# Start backend
pnpm run start:dev
```

Backend runs at: http://localhost:3000

### 5. Setup Frontend (in another terminal)

```bash
cd frontend

# Copy environment variables
cp .env.example .env

# Edit .env if needed
# VITE_API_URL=http://localhost:3000

# Start frontend
pnpm run dev
```

Frontend runs at: http://localhost:5173

## First Login

### 1. Register an Account

Navigate to http://localhost:5173 and click "Register"

- **Name**: Your name
- **Email**: your@email.com
- **Password**: Choose a strong password
- **Organization Name**: Your organization

### 2. Login

Use your credentials to log in.

### 3. Create an API Key

1. Go to **Settings** → **API Keys**
2. Click **Generate New Key**
3. Give it a name (e.g., "CI Pipeline")
4. Copy the key (you won't see it again!)

## Integrate with Playwright

### 1. Install the NPM Package

```bash
# Authenticate with GitHub Packages (one-time setup)
echo "@dashwright:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc

# Install the reporter
npm install @dashwright/playwright-reporter
```

### 2. Configure Playwright

Edit your `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";
import DashwrightReporter from "@dashwright/playwright-reporter";

export default defineConfig({
  reporter: [
    ["list"], // Keep console output
    [
      DashwrightReporter,
      {
        // API URL of your Dashwright backend
        apiUrl: "http://localhost:3000",

        // API key from Dashwright dashboard
        apiKey: "your-api-key-here",

        // Upload artifacts (screenshots, videos, traces)
        uploadArtifacts: true,

        // Optional: Project name
        projectName: "My Awesome Project",

        // Optional: Branch name (auto-detected from git)
        branch: process.env.BRANCH_NAME,
      },
    ],
  ],

  // Enable screenshots, videos, and traces
  use: {
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
});
```

### 3. Run Your Tests

```bash
npx playwright test
```

### 4. View Results

1. Go to your Dashwright dashboard: http://localhost:5173
2. Navigate to **Test Runs**
3. See your test results in real-time!

## Next Steps

### 🎨 Explore Features

- **Test Runs**: View all test executions
- **Artifacts**: Browse screenshots, videos, and traces
- **Settings**: Manage API keys and organization
- **Members**: Invite team members

### 📊 Advanced Configuration

- **Environment Variables**: See [Configuration Guide](./docs/configuration.md)
- **RBAC**: Set up role-based access control
- **Webhooks**: Configure test run notifications
- **CI/CD**: Integrate with GitHub Actions, GitLab CI, etc.

### 🚀 Deploy to Production

- **Kubernetes**: Use Helm chart in `helm-chart/` folder
- **Docker Swarm**: Use provided `docker-compose.yml`
- **Cloud**: Deploy to AWS, GCP, or Azure

See [Deployment Guide](./docs/deployment.md) for details.

### 🤝 Get Involved

- **⭐ Star the Project**: Help us grow!
- **🐛 Report Bugs**: [GitHub Issues](https://github.com/CybeDefend/dashwright/issues)
- **💡 Request Features**: [Feature Requests](https://github.com/CybeDefend/dashwright/issues/new?template=feature_request.md)
- **🤝 Contribute**: Read [CONTRIBUTING.md](./CONTRIBUTING.md)

## Common Issues

### Port Already in Use

If ports 3000, 5173, 5432, 9000, or 9001 are already in use:

```bash
# Option 1: Stop conflicting services
docker compose down

# Option 2: Change ports in docker-compose.yml
# Edit the ports section for each service
```

### Cannot Connect to Backend

```bash
# Check if backend is running
docker compose ps

# View backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Database Connection Failed

```bash
# Check PostgreSQL
docker compose logs postgres

# Reset database
docker compose down -v  # Warning: This deletes all data!
docker compose up -d
```

### NPM Package Authentication Failed

```bash
# Verify your GitHub token has read:packages permission
# Update your .npmrc with a valid token
echo "//npm.pkg.github.com/:_authToken=YOUR_NEW_TOKEN" >> .npmrc
```

## Need Help?

- **Documentation**: [Full docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/CybeDefend/dashwright/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CybeDefend/dashwright/discussions)
- **Email**: support@cybedefend.com

---

**🎉 Congratulations! You're now ready to use Dashwright!**

Happy testing! 🎭
