# Dashwright Scripts

This folder contains utility scripts for development and deployment.

## 📦 Release Script

The `release.sh` script helps automate the release process for Docker images and NPM packages.

### Usage

```bash
./scripts/release.sh
```

The script provides an interactive menu with the following options:

1. **Release Docker Images** - Creates a git tag to trigger Docker image builds
2. **Release NPM Package** - Updates package.json version and publishes to GitHub Packages
3. **Release All** - Releases both Docker images and NPM package together
4. **Exit** - Exit the script

### Prerequisites

Before running the script, ensure:

- You have committed all your changes
- You are on the `main` branch (or confirm to continue on another branch)
- You have push access to the GitHub repository
- You have the required GitHub permissions for releases

### Release Process

#### Docker Images Only

```bash
./scripts/release.sh
# Select option 1
# Enter version: 1.0.0
```

This will:
1. ✅ Check git working directory is clean
2. ✅ Check you're on the main branch
3. ✅ Prompt to update CHANGELOG.md
4. ✅ Create git tag `v1.0.0`
5. ✅ Push to GitHub
6. ✅ Trigger GitHub Actions workflow to build and publish Docker images

#### NPM Package Only

```bash
./scripts/release.sh
# Select option 2
# Enter version: 1.0.0
```

This will:
1. ✅ Check git working directory is clean
2. ✅ Check you're on the main branch
3. ✅ Update `integrations/npm-package/package.json` version
4. ✅ Prompt to update both CHANGELOG.md files
5. ✅ Create git tag `v1.0.0`
6. ✅ Push to GitHub
7. ✅ Trigger GitHub Actions workflow to publish NPM package

#### Release Everything

```bash
./scripts/release.sh
# Select option 3
# Enter version: 1.0.0
```

This will:
1. ✅ Update NPM package version
2. ✅ Prompt to update all changelogs
3. ✅ Create git tag `v1.0.0`
4. ✅ Push to GitHub
5. ✅ Trigger all CI/CD workflows (Docker + NPM)

### Version Format

The script expects semantic versioning: `MAJOR.MINOR.PATCH`

Examples:
- ✅ `1.0.0`
- ✅ `2.1.3`
- ✅ `0.1.0`
- ❌ `v1.0.0` (no 'v' prefix)
- ❌ `1.0` (missing patch)

### What Happens After Release

Once you push the tag:

1. **Docker Workflow** triggers and builds multi-arch images
   - Images are pushed to `ghcr.io/cybedefend/dashwright/backend:VERSION`
   - And `ghcr.io/cybedefend/dashwright/frontend:VERSION`

2. **NPM Workflow** triggers and publishes package
   - Package is published to `@dashwright/playwright-reporter@VERSION`
   - A GitHub release is created automatically

3. **Check Progress**
   - Visit https://github.com/CybeDefend/dashwright/actions
   - Monitor workflow execution
   - Check for any errors

### Manual Release (Without Script)

If you prefer to release manually:

#### Docker Images

```bash
git add .
git commit -m "chore: release version 1.0.0"
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin main --tags
```

#### NPM Package

```bash
cd integrations/npm-package
npm version 1.0.0 --no-git-tag-version
cd ../..
git add .
git commit -m "chore: release npm package 1.0.0"
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin main --tags
```

## 🔍 Troubleshooting

### Script says "Git working directory is not clean"

You have uncommitted changes. Either commit them or stash them:

```bash
git status
git add .
git commit -m "your commit message"
# or
git stash
```

### Script says "Invalid version format"

Use semantic versioning without the 'v' prefix:
- ✅ `1.0.0`
- ❌ `v1.0.0`

### GitHub Actions workflow doesn't trigger

Check:
1. Tag was pushed: `git push origin --tags`
2. Workflow file exists: `.github/workflows/docker.yml` or `publish-npm.yml`
3. You have push permissions to the repository

### Docker images don't appear in GHCR

Check GitHub Actions logs for build errors:
- Navigate to repository Actions tab
- Click on the failed workflow
- Check build logs for errors

### NPM package doesn't publish

Ensure:
1. `package.json` has correct `publishConfig`
2. `GITHUB_TOKEN` has packages write permission
3. Package name matches scoped format: `@dashwright/playwright-reporter`

## 📚 Additional Scripts

You can add more scripts to this folder as needed. Follow these conventions:

- Use `.sh` extension for shell scripts
- Make scripts executable: `chmod +x scripts/your-script.sh`
- Add documentation to this README
- Include error handling with `set -e`
- Use colors for better UX (see `release.sh` for examples)

### Future Script Ideas

- `scripts/dev.sh` - Start all services in development mode
- `scripts/test.sh` - Run all tests (backend, frontend, npm)
- `scripts/build.sh` - Build all components
- `scripts/deploy.sh` - Deploy to staging/production environments
- `scripts/db-migrate.sh` - Run database migrations
- `scripts/backup.sh` - Backup database and files

## 🤝 Contributing

When adding new scripts:

1. Create the script in `scripts/` folder
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add documentation to this README
4. Test the script thoroughly
5. Submit a PR with clear description

## 📖 Related Documentation

- [CI/CD Documentation](../.github/CI-CD.md)
- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
