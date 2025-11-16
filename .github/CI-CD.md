# CI/CD Documentation

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. CI - Tests & Quality (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

- `test-backend`: Lints, builds, and tests the backend with PostgreSQL
- `test-frontend`: Lints, builds, and tests the frontend
- `test-npm-package`: Builds and validates the NPM package

### 2. Build and Publish Docker Images (`docker.yml`)

**Triggers:**

- Push to `main` branch
- Git tags matching `v*.*.*` (e.g., `v1.0.0`)
- Pull requests (build only, no push)
- Manual workflow dispatch

**Jobs:**

- `build-backend`: Builds and pushes backend Docker image to GHCR
- `build-frontend`: Builds and pushes frontend Docker image to GHCR
- `create-release`: Creates a GitHub release (only on version tags)

**Image Tags:**

- `latest` - Latest version from main branch
- `main` - Latest version from main branch
- `v1.0.0` - Specific version (from git tags)
- `1.0` - Major.minor version
- `1` - Major version
- `main-sha1234567` - Branch and commit SHA

**Supported Platforms:**

- `linux/amd64`
- `linux/arm64`

### 3. Publish NPM Package (`publish-npm.yml`)

**Triggers:**

- Git tags matching `v*.*.*` (e.g., `v1.0.0`)
- Manual workflow dispatch with version input

**Jobs:**

- Builds and publishes `@dashwright/playwright-reporter` to GitHub Packages
- Creates a GitHub release with installation instructions

## Usage

### Publishing a New Version

#### 1. Docker Images

```bash
# Tag a new version
git tag v1.0.0
git push origin v1.0.0

# The workflow will automatically:
# - Build Docker images for backend and frontend
# - Push to ghcr.io/cybedefend/dashwright/backend:1.0.0
# - Push to ghcr.io/cybedefend/dashwright/frontend:1.0.0
# - Create a GitHub release
```

#### 2. NPM Package

```bash
# Update version in package.json
cd integrations/npm-package
npm version 1.0.0

# Commit and tag
git add package.json
git commit -m "chore: bump npm package to v1.0.0"
git tag npm-v1.0.0
git push origin main --tags

# Or use manual workflow dispatch
```

### Using Published Images

#### Pull from GitHub Container Registry

```bash
# Backend
docker pull ghcr.io/cybedefend/dashwright/backend:latest
docker pull ghcr.io/cybedefend/dashwright/backend:1.0.0

# Frontend
docker pull ghcr.io/cybedefend/dashwright/frontend:latest
docker pull ghcr.io/cybedefend/dashwright/frontend:1.0.0
```

#### Using Docker Compose

```bash
# Pull latest images
docker compose pull

# Start services
docker compose up -d
```

### Installing NPM Package

#### From GitHub Packages

1. Create a `.npmrc` file in your project:

```properties
@dashwright:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Set your GitHub token:

```bash
export GITHUB_TOKEN=your_github_personal_access_token
```

3. Install the package:

```bash
npm install @dashwright/playwright-reporter
```

#### In Playwright Config

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
      },
    ],
  ],
});
```

## Required Secrets

The workflows use the following secrets (automatically provided by GitHub):

- `GITHUB_TOKEN` - Used for:
  - Pushing Docker images to GHCR
  - Publishing NPM packages to GitHub Packages
  - Creating releases

### Additional Setup (Optional)

For publishing to public NPM registry or other registries, add these secrets:

- `NPM_TOKEN` - NPM registry authentication token
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_TOKEN` - Docker Hub token

## Registry URLs

- **Docker Images**: `ghcr.io/cybedefend/dashwright/`
- **NPM Package**: `@dashwright/playwright-reporter`
- **GitHub Packages**: `https://npm.pkg.github.com/@dashwright`

## Permissions

The workflows require the following permissions:

- `contents: read` - Read repository contents
- `packages: write` - Push to GitHub Container Registry and Packages

These are automatically granted by GitHub Actions.

## Cache Strategy

The workflows use caching to speed up builds:

- **pnpm store** - Cached for faster dependency installation
- **Docker layers** - Cached using GitHub Actions cache (gha)

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. **Docker**: Ensure GITHUB_TOKEN has `packages:write` permission
2. **NPM**: Check your personal access token has `write:packages` scope
3. **Rate Limits**: GitHub has rate limits for package operations

### Build Failures

1. Check the workflow logs in the "Actions" tab
2. Verify Dockerfile and package.json are valid
3. Ensure all dependencies are available

### Image Pull Issues

If you can't pull images:

1. Make sure you're authenticated:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

2. Check image exists:

```bash
docker search ghcr.io/cybedefend/dashwright
```

3. Verify package visibility is public or you have access

## Best Practices

1. **Version Tags**: Use semantic versioning (v1.0.0, v1.1.0, etc.)
2. **Branch Protection**: Require CI checks to pass before merging
3. **Release Notes**: Update CHANGELOG.md before tagging
4. **Testing**: Always test in staging before tagging for production
5. **Rollback**: Keep previous versions available for quick rollback

## Monitoring

Check workflow status:

- GitHub Actions tab in repository
- Status badges (add to README.md)
- Email notifications for failures

## Support

For issues or questions:

- GitHub Issues: https://github.com/CybeDefend/dashwright/issues
- Documentation: See repository README.md
