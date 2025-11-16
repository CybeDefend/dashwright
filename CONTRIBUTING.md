# Contributing to Dashwright

Thank you for considering contributing to Dashwright! This document outlines the process for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 22.14.0 or higher
- pnpm 10.22.0 or higher
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)
- Git

### Setup Development Environment

1. **Fork and Clone**

```bash
git clone https://github.com/YOUR_USERNAME/dashwright.git
cd dashwright
```

2. **Install Dependencies**

```bash
# Install all workspace dependencies
pnpm install
```

3. **Start Services**

```bash
# Start PostgreSQL and MinIO
docker compose up -d postgres minio

# Start backend in dev mode
cd backend
pnpm run start:dev

# In another terminal, start frontend
cd frontend
pnpm run dev
```

4. **Access the Application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MinIO Console: http://localhost:9001

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and focused

### 3. Test Your Changes

```bash
# Backend tests
cd backend
pnpm run test

# Frontend tests
cd frontend
pnpm run test

# NPM package tests
cd integrations/npm-package
pnpm run test
```

### 4. Lint Your Code

```bash
# Backend
cd backend
pnpm run lint

# Frontend
cd frontend
pnpm run lint

# NPM package
cd integrations/npm-package
pnpm run lint
```

### 5. Commit Your Changes

Follow the [Commit Convention](#commit-convention):

```bash
git add .
git commit -m "feat(frontend): add test result filtering"
```

### 6. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub.

## 🔀 Pull Request Process

### Before Submitting

- ✅ Ensure all tests pass
- ✅ Ensure linting passes
- ✅ Update documentation if needed
- ✅ Add changeset if applicable
- ✅ Rebase on latest main branch

### PR Title Format

Use conventional commits format:

```
type(scope): description

Examples:
feat(backend): add WebSocket support for real-time updates
fix(frontend): resolve token refresh race condition
docs: update CI/CD documentation
refactor(npm-package): simplify artifact upload logic
```

### PR Description Template

```markdown
## Description

Brief description of what this PR does

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran to verify your changes

## Checklist

- [ ] My code follows the code style of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated Checks** - CI/CD runs automatically

   - Tests (backend, frontend, npm package)
   - Linting
   - Security scanning (Trivy)
   - Dependency review
   - PR title validation

2. **Code Review** - At least one maintainer must approve

   - Code quality
   - Test coverage
   - Documentation
   - Breaking changes

3. **Merge** - Maintainers will merge when ready
   - Squash and merge (default)
   - Merge commit (for multi-commit PRs)

## 📝 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Avoid `any` type, use `unknown` if needed

### Backend (NestJS)

```typescript
// Good
@Injectable()
export class TestRunService {
  constructor(
    @InjectRepository(TestRun)
    private readonly testRunRepository: Repository<TestRun>
  ) {}

  async findById(id: string): Promise<TestRun | null> {
    return this.testRunRepository.findOne({ where: { id } });
  }
}

// Bad
export class TestRunService {
  constructor(private testRunRepository: any) {} // Don't use any

  async findById(id: string) {
    return this.testRunRepository.findOne({ where: { id } }); // Missing return type
  }
}
```

### Frontend (React)

```typescript
// Good
interface TestResultProps {
  testRun: TestRun;
  onRefresh: () => void;
}

export const TestResult: React.FC<TestResultProps> = ({
  testRun,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear effect
    return () => {
      setLoading(false);
    };
  }, []);

  return <div>{/* ... */}</div>;
};

// Bad
export const TestResult = (props: any) => {
  // Use proper types
  const [loading, setLoading] = useState(); // Specify type

  return <div>{/* ... */}</div>;
};
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow existing design system
- Use CSS variables for theme colors
- Mobile-first responsive design

```jsx
// Good
<div className="card">
  <h2 className="gradient-text">Title</h2>
  <button className="btn-primary">Click</button>
</div>

// Bad
<div style={{ background: 'white', padding: '20px' }}> // Use Tailwind classes
  <h2>Title</h2>
</div>
```

## 📜 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
type(scope?): description

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style changes (formatting, missing semicolons, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependency updates
- `ci` - CI/CD configuration changes
- `build` - Build system changes

### Scopes

- `backend` - Backend API changes
- `frontend` - Frontend UI changes
- `npm-package` - NPM package changes
- `docker` - Docker configuration
- `ci` - CI/CD workflows
- `docs` - Documentation

### Examples

```bash
# Feature
git commit -m "feat(frontend): add dark mode toggle"

# Bug fix
git commit -m "fix(backend): resolve JWT token expiration issue"

# Documentation
git commit -m "docs: update installation instructions"

# Breaking change
git commit -m "feat(backend)!: change API response format

BREAKING CHANGE: All API responses now use camelCase instead of snake_case"
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pnpm run test              # Run all tests
pnpm run test:watch        # Watch mode
pnpm run test:cov          # Coverage report
```

Write tests for:

- ✅ Controllers (API endpoints)
- ✅ Services (business logic)
- ✅ Guards (authentication, authorization)
- ✅ Utilities (helper functions)

### Frontend Tests

```bash
cd frontend
pnpm run test              # Run all tests
pnpm run test:watch        # Watch mode
pnpm run test:coverage     # Coverage report
```

Write tests for:

- ✅ Components (rendering, interactions)
- ✅ Hooks (custom React hooks)
- ✅ Services (API calls)
- ✅ Store (state management)

### Integration Tests

```bash
# Test with real database
docker compose up -d postgres
cd backend
pnpm run test:e2e
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Explain complex algorithms
- Document function parameters and return types
- Include usage examples

````typescript
/**
 * Uploads a test artifact to MinIO storage
 *
 * @param file - The file to upload
 * @param testRunId - ID of the test run
 * @param type - Type of artifact (screenshot, video, trace)
 * @returns Promise with the uploaded artifact metadata
 *
 * @example
 * ```typescript
 * const artifact = await uploadArtifact(
 *   screenshotBuffer,
 *   'test-run-123',
 *   ArtifactType.SCREENSHOT
 * );
 * ```
 */
async uploadArtifact(
  file: Buffer,
  testRunId: string,
  type: ArtifactType
): Promise<Artifact> {
  // Implementation
}
````

### README Updates

When adding new features:

- Update main README.md
- Add to appropriate section
- Include code examples
- Update table of contents

### Changelog

- Update CHANGELOG.md for significant changes
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Group changes by type (Added, Changed, Fixed, etc.)

## 🐛 Reporting Bugs

### Before Reporting

- Check if the bug was already reported
- Try to reproduce with latest version
- Gather relevant information

### Bug Report Template

```markdown
## Bug Description

Clear and concise description of the bug

## To Reproduce

Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

What you expected to happen

## Screenshots

If applicable, add screenshots

## Environment

- OS: [e.g., macOS 14.0]
- Node.js: [e.g., 22.14.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

## Additional Context

Any other context about the problem
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
## Feature Description

Clear and concise description of the feature

## Problem

What problem does this solve?

## Proposed Solution

How should it work?

## Alternatives Considered

Other solutions you've considered

## Additional Context

Mockups, examples, etc.
```

## 📞 Getting Help

- **Documentation**: Read [README.md](./README.md) and [CI/CD docs](./.github/CI-CD.md)
- **Issues**: Search [existing issues](https://github.com/CybeDefend/dashwright/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/CybeDefend/dashwright/discussions)

## 🎯 Areas for Contribution

Looking for where to help? Check these areas:

### Good First Issues

- Documentation improvements
- Adding tests
- Fixing typos
- Small bug fixes

### Help Wanted

- Performance optimizations
- UI/UX improvements
- New integrations
- Advanced features

### Priorities

- 🔴 High - Critical bugs, security issues
- 🟡 Medium - Feature requests, enhancements
- 🟢 Low - Nice-to-have improvements

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You!

Your contributions make Dashwright better for everyone. We appreciate your time and effort!
