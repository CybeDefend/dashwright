# Task: Build "Dashwright" - Modern Playwright Dashboard

## Objective

Create **Dashwright**, an open-source Playwright dashboard under the repository `CybeDefend/Dashwright`.  
Dashwright must provide a clean, modern and extremely intuitive interface for visualizing Playwright runs, including screenshots, videos and logs.  

The platform must be easy to connect through a dedicated NPM package.

The dashboard must support:
- Login and password authentication only
- Organizations and teams
- RBAC with roles
- A very modular code structure
- Strong backend validation using DTOs and class-validator
- Secure database interactions (ORM recommended below)

Every part of the project must use **the latest stable versions available for each dependency**, unless explicitly incompatible.  
NodeJS version must be **v22.14.0** and this requirement must be enforced across the backend, frontend build system and integrations.

A single **README.md** must document:
- The architecture and stack
- How to run via Docker Compose
- How to deploy with Helm
- How to integrate the NPM package
- License Apache 2.0
- Author CybeDefend
- A visually clean and modern presentation

All code must be written in **English**.  
The README must be **very design oriented**, clean and visually attractive.

---

# 1. File Structure

```

Dashwright/
├─ backend/
│  ├─ src/
│  │  ├─ auth/                     # Authentication, JWT, RBAC, guards
│  │  ├─ users/                    # Users, orgs, teams logic
│  │  ├─ test-runs/                # Runs, realtime, run metadata
│  │  ├─ artifacts/                # S3 or MinIO uploads
│  │  ├─ integrations/             # Endpoints for NPM package
│  │  ├─ common/
│  │  │  ├─ dto/                   # Centralized DTOs with class-validator
│  │  │  ├─ guards/                # RBAC, authentication guards
│  │  │  ├─ decorators/            # Custom decorators
│  │  │  └─ utils/                 # Shared utilities
│  │  ├─ main.ts
│  │  └─ app.module.ts
│  ├─ package.json
│  ├─ Dockerfile
│  └─ tsconfig.json
│
├─ frontend/
│  ├─ src/
│  │  ├─ components/               # Reusable design system
│  │  ├─ pages/                    # Dashboard, run detail, admin
│  │  ├─ layouts/                  # App layout, auth layout
│  │  ├─ services/                 # API client, websocket client
│  │  ├─ store/                    # Zustand or Redux Toolkit
│  │  └─ main.tsx
│  ├─ package.json
│  └─ Dockerfile
│
├─ integrations/
│  ├─ npm-package/
│  │  ├─ src/
│  │  │  ├─ index.ts               # Package entrypoint
│  │  │  ├─ reporter.ts            # Playwright reporter
│  │  │  ├─ uploader.ts            # Artifact upload logic
│  │  │  └─ types.ts               # Shared types
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ future/                      # Placeholder for future integrations
│
├─ docker-compose.yaml
├─ helm-chart/
│  ├─ templates/
│  └─ values.yaml
│
├─ README.md                       # Main documentation (design oriented)
├─ LICENSE                         # Apache 2.0
└─ .env.example

```

---

# 2. Technical Stack Requirements

## Backend
- NodeJS **v22.14.0**
- NestJS (latest)
- TypeORM (latest) with PostgreSQL to prevent SQL injection
- class-validator and class-transformer for all DTOs
- JWT authentication
- Argon2 or bcrypt for password hashing
- WebSockets with NestJS Gateway
- Storage for artifacts: MinIO or S3 compatible
- Latest stable versions for all dependencies

## Frontend
- React (latest)
- Vite (latest)
- Tailwind CSS (latest)
- Zustand or Redux Toolkit (latest)
- Very modern, clean and minimalistic design
- Responsive layout
- WebSocket client for real time updates

## NPM Package
- NodeJS v22.14.0 compatibility
- TypeScript (latest)
- Playwright Reporter API (latest)
- Configurable server URL
- Upload screenshots, videos and logs
- Handle retries and network errors gracefully
- Strong typing everywhere

## Deployment
- Docker images for frontend and backend
- Docker Compose for local usage
- Helm chart for Kubernetes deployment
- TLS termination through ingress
- Environment variables for all config values

---

# 3. Security Requirements

1. Enforce Node version **v22.14.0**
2. Validate every DTO using class-validator
3. Prevent SQL injections through TypeORM
4. Hash passwords using argon2 or bcrypt
5. Limit login attempts per IP
6. Store JWT secret and DB credentials in environment variables only
7. Serve only over HTTPS when deployed
8. Sanitize artifact filenames
9. Ensure correct MIME type on artifact uploads
10. Optional CSRF protection for UI

---

# 4. Authentication System

- Login and password only
- No email system
- JWT access token and refresh token
- Users belong to organizations
- Organizations contain teams
- RBAC roles:
  - admin
  - maintainer
  - viewer
- Route-level permissions with guards
- Adapter-style RBAC service for reusability

---

# 5. Features to Implement

## Backend
- Authentication module with RBAC
- User management (CRUD)
- Organization management
- Team management
- Role assignment
- Test run ingestion
- Artifact upload endpoint
- WebSocket push for run updates
- Integrations module for NPM package ingestion
- Strict DTO validation everywhere
- Automatic database migrations

## Frontend
- Clean login page
- Dashboard list of runs
- Test run detail page
  - Video player
  - Screenshot gallery
  - Logs viewer
- Admin page for users, orgs and teams
- Sidebar and topbar layout
- Light and modern color palette
- Responsive UI
- Smooth transitions and animations
- Reusable UI design system
- Documentation page embedded in the app (optional)

## NPM Package
- Reporter triggered at test end
- Create run via backend API
- Upload logs, screenshots and videos
- Send test results metadata
- Provide TypeScript types
- Retry on network error
- Support parallel workers
- Provide CLI flags for configuration
- Provide documentation in README

---

# 6. Database Schema

**Database: PostgreSQL**

Tables:

- users
- organizations
- teams
- user_roles
- test_runs
- artifacts

Use TypeORM relations and ensure latest version compatibility.

---

# 7. Deployment Tasks

## Docker Compose
- backend
- frontend
- postgres
- minio
- redis (optional caching)
- env files for config
- persistent volumes

## Helm Deployment
- Create chart
- Configurable values.yaml
- Deploy backend, frontend, postgres and MinIO
- Implement readiness and liveness probes
- Secure ingress
- Provide sample production values file

---

# 8. README Requirements

The README must be:
- Single file
- Very modern, clean and design oriented
- Explains the stack
- Explains how to run locally with Docker Compose
- Explains how to deploy with Helm
- Describes how to use the NPM package
- Includes architecture diagrams
- Includes screenshots of the UI
- Includes badges (License Apache 2.0, build, version)
- A section describing UI philosophy: beautiful, minimal, easy for beginners

---

# 9. Step by Step Tasks for the Agent

1. Create the repository structure
2. Initialize backend with NestJS (latest)
3. Configure Node version v22.14.0 in engines and CI
4. Install all backend dependencies in their latest version
5. Create DTOs with class-validator for all endpoints
6. Implement authentication with JWT
7. Implement RBAC and organizations
8. Implement user, org and team modules
9. Implement test run module
10. Implement artifact upload module
11. Add WebSocket real time updates
12. Implement integration endpoints for the NPM package
13. Implement ORM models and migrations
14. Initialize frontend with React, Vite, Tailwind (latest versions)
15. Build all UI pages in a very modern and minimal design
16. Implement data fetching services
17. Implement WebSocket real time updates in frontend
18. Build NPM package with Playwright Reporter
19. Add retry logic, upload utilities and types
20. Write package documentation
21. Create Dockerfiles for backend and frontend
22. Create docker-compose.yaml
23. Create Helm chart
24. Write the README in a clean and visual style
25. Add Apache 2.0 license
26. Ensure all dependencies are the latest available
27. Ensure code quality, proper validation and security best practices
