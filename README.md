<div align="center">

# 🎭 Dashwright

### Modern Playwright Dashboard

_A beautiful, intuitive dashboard for visualizing Playwright test runs with real-time updates_

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node](https://img.shields.io/badge/Node-22.14.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1-ea2845.svg)](https://nestjs.com/)

[![CI](https://github.com/CybeDefend/dashwright/actions/workflows/ci.yml/badge.svg)](https://github.com/CybeDefend/dashwright/actions/workflows/ci.yml)
[![Docker](https://github.com/CybeDefend/dashwright/actions/workflows/docker.yml/badge.svg)](https://github.com/CybeDefend/dashwright/actions/workflows/docker.yml)
[![NPM](https://github.com/CybeDefend/dashwright/actions/workflows/publish-npm.yml/badge.svg)](https://github.com/CybeDefend/dashwright/actions/workflows/publish-npm.yml)
[![Helm](https://img.shields.io/badge/Helm-v1.0.0-0f1689.svg)](https://github.com/CybeDefend/dashwright/tree/main/helm-chart)

[Features](#✨-features) • [Quick Start](#🚀-quick-start) • [Installation](#📦-installation) • [Documentation](#📚-documentation) • [Architecture](#🏗️-architecture) • [Contributing](#🤝-contributing) • [License](#📄-license)

---

</div>

## 🌟 Overview

**Dashwright** is an open-source, enterprise-ready dashboard for Playwright test automation. Built with modern technologies and a focus on developer experience, it provides real-time insights into your test runs with a clean, minimalistic interface.

### Why Dashwright?

- **🎨 Beautiful UI** - Clean, modern design built with React and Tailwind CSS
- **⚡ Real-time Updates** - WebSocket-powered live test run updates
- **🔐 Secure by Default** - JWT authentication, RBAC, and comprehensive input validation
- **📊 Rich Artifacts** - View screenshots, videos, logs, and traces
- **🏢 Multi-tenancy** - Organizations and teams support
- **🚀 Easy Integration** - Simple NPM package for Playwright projects
- **☁️ Cloud-Ready** - Docker and Kubernetes deployment included

---

## ✨ Features

### Dashboard

- 📈 Real-time test run visualization
- 🎥 Video playback of test executions
- 📸 Screenshot galleries for failed tests
- 📝 Comprehensive logs and traces
- 🔍 Advanced filtering and search
- 📊 Test run statistics and trends

### Security & Access Control

- 🔐 JWT-based authentication
- 👥 Organizations and teams
- 🛡️ Role-based access control (RBAC)
- 🔒 Secure artifact storage with MinIO/S3
- 🚦 Rate limiting and input validation

### Developer Experience

- 🎯 Simple NPM package integration
- 🔄 Automatic artifact uploads
- 🎭 Native Playwright reporter
- 📡 Real-time WebSocket notifications
- 🐛 Detailed error reporting

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v22.14.0
- **pnpm** v10.22.0
- **Docker** & **Docker Compose** (for local development)

### Run with Docker Compose

1. **Clone the repository**

   ```bash
   git clone https://github.com/CybeDefend/Dashwright.git
   cd Dashwright
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the services**

   ```bash
   docker-compose up -d
   ```

4. **Access the dashboard**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - MinIO Console: http://localhost:9001

### Default Credentials

```
Username: admin
Password: changeme
```

> ⚠️ **Important:** Change default credentials in production!

### Development Mode

**First time setup:**

```bash
cp .env.example .env.local
# Edit .env.local (use localhost for DB_HOST and STORAGE_ENDPOINT)
make install
```

**Daily workflow:**

```bash
make dev              # Start PostgreSQL + MinIO (Terminal 1)
make dev-backend      # Start backend with hot reload (Terminal 2)
make dev-frontend     # Start frontend with HMR (Terminal 3)
```

Or use VSCode Task: `Cmd+Shift+P` → `Tasks: Run Task` → `Dev Mode: Start All`

See [DEVELOPMENT.md](DEVELOPMENT.md) for more details.

---

## 📦 Installation

### Using Published Docker Images

Pull the latest images from GitHub Container Registry:

```bash
# Pull images
docker pull ghcr.io/cybedefend/dashwright/backend:latest
docker pull ghcr.io/cybedefend/dashwright/frontend:latest

# Or use docker-compose
docker compose pull
docker compose up -d
```

**Specific versions:**

```bash
docker pull ghcr.io/cybedefend/dashwright/backend:1.0.0
docker pull ghcr.io/cybedefend/dashwright/frontend:1.0.0
```

### Authentication for Private Registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

---

## 📦 NPM Package Integration

### Installation

1. **Create `.npmrc` in your project root:**

```properties
@dashwright:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. **Set your GitHub token:**

```bash
export GITHUB_TOKEN=your_github_personal_access_token
```

3. **Install the package:**

```bash
npm install @dashwright/playwright-reporter
# or
pnpm add @dashwright/playwright-reporter
```

### Configuration

Configure in `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";
import DashwrightReporter from "@dashwright/playwright-reporter";

export default defineConfig({
  reporter: [
    ["list"],
    [
      DashwrightReporter,
      {
        apiUrl: "http://localhost:3006",
        apiKey: "your-api-key",
        runName: "CI Test Run",
        environment: "staging",
        branch: process.env.CI_BRANCH || "main",
      },
    ],
    ["html"],
  ],

  use: {
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
```

Run your tests:

```bash
npx playwright test
```

---

## 🏗️ Architecture

### Technology Stack

#### Backend

- **Framework:** NestJS 11.1
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL 16 with TypeORM
- **Storage:** MinIO (S3-compatible)
- **Authentication:** JWT with Argon2 password hashing
- **Real-time:** WebSocket with Socket.IO
- **Validation:** class-validator & class-transformer

#### Frontend

- **Framework:** React 19.2
- **Build Tool:** Vite 7.2
- **Styling:** Tailwind CSS 4.1
- **State Management:** Zustand 5.0
- **HTTP Client:** Axios 1.13
- **Routing:** React Router 7.9
- **Real-time:** Socket.IO Client

#### Infrastructure

- **Containerization:** Docker
- **Orchestration:** Kubernetes with Helm
- **Node Version:** 22.14.0
- **Package Manager:** pnpm 10.22.0

### System Architecture

```
┌─────────────────┐       ┌─────────────────┐
│   Playwright    │──────▶│  NPM Reporter   │
│   Test Runner   │       │   Package       │
└─────────────────┘       └────────┬────────┘
                                   │
                                   │ Upload
                                   ▼
┌──────────────────────────────────────────────┐
│              Dashwright Backend              │
│  ┌────────────┐  ┌─────────────┐  ┌────────┐│
│  │    Auth    │  │  Test Runs  │  │ RBAC   ││
│  └────────────┘  └─────────────┘  └────────┘│
│  ┌────────────┐  ┌─────────────┐  ┌────────┐│
│  │ Artifacts  │  │  WebSocket  │  │ Users  ││
│  └────────────┘  └─────────────┘  └────────┘│
└─────────┬────────────────────────────────────┘
          │
          ├──────▶ PostgreSQL (Metadata)
          └──────▶ MinIO/S3 (Artifacts)
                   │
                   ▼
          ┌─────────────────┐
          │  Frontend SPA   │
          │  React + Vite   │
          └─────────────────┘
```

### Project Structure

```
Dashwright/
├─ backend/              # NestJS backend application
│  ├─ src/
│  │  ├─ auth/          # Authentication & JWT
│  │  ├─ users/         # Users, orgs, teams
│  │  ├─ test-runs/     # Test run management
│  │  ├─ artifacts/     # Artifact storage & retrieval
│  │  ├─ integrations/  # NPM package endpoints
│  │  └─ common/        # DTOs, guards, decorators
│  ├─ Dockerfile
│  └─ package.json
│
├─ frontend/            # React frontend application
│  ├─ src/
│  │  ├─ components/   # Reusable UI components
│  │  ├─ pages/        # Dashboard pages
│  │  ├─ layouts/      # App layouts
│  │  ├─ services/     # API & WebSocket clients
│  │  └─ store/        # Zustand state management
│  ├─ Dockerfile
│  └─ package.json
│
├─ integrations/
│  └─ npm-package/     # Playwright reporter package
│     ├─ src/
│     │  ├─ reporter.ts  # Playwright reporter
│     │  ├─ uploader.ts  # Artifact uploader
│     │  └─ types.ts     # TypeScript types
│     └─ package.json
│
├─ helm-chart/         # Kubernetes deployment
│  ├─ templates/
│  └─ values.yaml
│
├─ docker-compose.yaml # Local development
├─ .env.example        # Environment template
└─ README.md
```

---

## 🐳 Deployment

### Docker Compose (Development)

```bash
docker-compose up -d
```

Services included:

- Backend (NestJS)
- Frontend (React)
- PostgreSQL
- MinIO

### Kubernetes with Helm (Production)

1. **Add the Helm repository**

   ```bash
   helm repo add dashwright https://cybedefend.github.io/dashwright
   helm repo update
   ```

2. **Install the chart**

   ```bash
   helm install dashwright dashwright/dashwright \
     --namespace dashwright \
     --create-namespace \
     --set ingress.hosts[0].host=dashwright.local \
     --set postgresql.auth.password=secure-password \
     --set minio.auth.rootPassword=secure-password \
     --set env.backend.JWT_SECRET=your-jwt-secret
   ```

3. **Verify deployment**
   ```bash
   kubectl get pods -n dashwright
   ```

### Custom values.yaml

Create a `custom-values.yaml`:

```yaml
ingress:
  enabled: true
  hosts:
    - host: dashwright.yourcompany.com
      paths:
        - path: /
          service: frontend
        - path: /api
          service: backend

postgresql:
  auth:
    password: your-secure-password

minio:
  auth:
    rootPassword: your-secure-password

env:
  backend:
    JWT_SECRET: your-jwt-secret-key
```

Deploy:

```bash
helm install dashwright ./helm-chart -f custom-values.yaml
```

---

## 🔧 Configuration

### Environment Variables

#### Backend

| Variable           | Description         | Default                |
| ------------------ | ------------------- | ---------------------- |
| `NODE_ENV`         | Environment mode    | `development`          |
| `PORT`             | Server port         | `3000`                 |
| `DB_HOST`          | PostgreSQL host     | `postgres`             |
| `DB_PORT`          | PostgreSQL port     | `5432`                 |
| `DB_USERNAME`      | Database username   | `dashwright`           |
| `DB_PASSWORD`      | Database password   | `changeme`             |
| `JWT_SECRET`       | JWT signing secret  | **required**           |
| `JWT_EXPIRES_IN`   | Access token expiry | `1h`                   |
| `STORAGE_ENDPOINT` | MinIO/S3 endpoint   | `minio`                |
| `STORAGE_BUCKET`   | Bucket name         | `dashwright-artifacts` |

#### Frontend

| Variable       | Description     | Default                 |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_WS_URL`  | WebSocket URL   | `ws://localhost:3000`   |

---

## 🛡️ Security Features

### Authentication & Authorization

- ✅ JWT access & refresh tokens
- ✅ Argon2 password hashing
- ✅ Role-based access control (Admin, Maintainer, Viewer)
- ✅ Organization-based multi-tenancy
- ✅ IP-based rate limiting

### Data Protection

- ✅ Input validation with class-validator
- ✅ SQL injection prevention with TypeORM
- ✅ Secure file uploads with MIME type validation
- ✅ Sanitized filenames
- ✅ Environment-based secrets
- ✅ HTTPS/TLS support

### Best Practices

- ✅ Principle of least privilege
- ✅ Secure defaults
- ✅ Regular dependency updates
- ✅ Comprehensive error handling
- ✅ Audit logging

---

## 📚 Documentation

### API Documentation

Once running, access the API documentation at:

- Swagger UI: `http://localhost:3000/api/docs` (if enabled)

### Key Endpoints

#### Authentication

```bash
POST /auth/login          # Login
POST /auth/refresh        # Refresh token
```

#### Test Runs

```bash
GET    /test-runs         # List all runs
POST   /test-runs         # Create run
GET    /test-runs/:id     # Get run details
PUT    /test-runs/:id     # Update run
DELETE /test-runs/:id     # Delete run
```

#### Artifacts

```bash
POST   /artifacts/upload         # Upload artifact
GET    /artifacts/test-run/:id   # Get run artifacts
GET    /artifacts/:id/download-url # Get download URL
```

---

## 🎨 Design Philosophy

Dashwright is built with a focus on:

- **Simplicity** - Clean, intuitive interfaces that anyone can use
- **Performance** - Fast loading times and real-time updates
- **Accessibility** - Keyboard navigation and screen reader support
- **Responsiveness** - Works beautifully on all devices
- **Modern** - Latest technologies and best practices

The UI follows modern design principles with:

- Generous whitespace
- Clear typography
- Subtle animations
- Consistent color palette
- Intuitive navigation

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/CybeDefend/Dashwright.git
   cd Dashwright
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd backend && pnpm install

   # Frontend
   cd ../frontend && pnpm install

   # NPM Package
   cd ../integrations/npm-package && pnpm install
   ```

3. **Start development servers**

   ```bash
   # Backend
   cd backend && pnpm run start:dev

   # Frontend
   cd frontend && pnpm run dev
   ```

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- 100% type coverage

---

## 📄 License

**Apache License 2.0**

Copyright © 2025 CybeDefend

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

## 📚 Additional Resources

- **[Contributing Guide](./CONTRIBUTING.md)** - Learn how to contribute to the project
- **[CI/CD Documentation](./.github/CI-CD.md)** - Automated deployment workflows
- **[Scripts Documentation](./scripts/README.md)** - Helper scripts for development
- **[Changelog](./CHANGELOG.md)** - Version history and release notes
- **[Issue Templates](./.github/ISSUE_TEMPLATE/)** - Report bugs or request features

---

## 🌟 Star History

If you find Dashwright useful, please consider giving it a star! ⭐

---

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/CybeDefend/dashwright/issues)
- **Discussions:** [GitHub Discussions](https://github.com/CybeDefend/dashwright/discussions)
- **Documentation:** Check our [guides and API docs](./docs/)
- **Email:** support@cybedefend.com

### Common Issues

- **Authentication Problems**: Check the [troubleshooting guide](./.github/CI-CD.md#troubleshooting)
- **Docker Issues**: Ensure Docker and Docker Compose are properly installed
- **Build Errors**: Verify Node.js 22.14.0+ and pnpm 10.22.0+ are installed

---

<div align="center">

**Built with ❤️ by [CybeDefend](https://github.com/CybeDefend)**

[GitHub](https://github.com/CybeDefend/dashwright) • [Issues](https://github.com/CybeDefend/dashwright/issues) • [Discussions](https://github.com/CybeDefend/dashwright/discussions)

</div>
