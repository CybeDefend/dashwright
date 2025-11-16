# Development Mode

## Quick Start

```bash
make dev              # Start PostgreSQL + MinIO
make dev-backend      # In another terminal
make dev-frontend     # In another terminal
```

Open http://localhost:5173

## Available Commands

```bash
make help             # Show all commands
make dev              # Start PostgreSQL + MinIO
make dev-backend      # Start backend in watch mode
make dev-frontend     # Start frontend in watch mode
make stop             # Stop all services
make status           # Show services status
make logs             # View all logs
make install          # Install all dependencies
make build            # Build backend + frontend
make test             # Run all tests
```

## Configuration

### URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3006
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5433

### Environment Variables

For local development, use `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local with localhost settings
```

The `make dev` command automatically copies `.env.local` to `backend/.env` and `frontend/.env`.

**Important**:

- `.env` = Docker/Production (uses service names: `postgres`, `minio`)
- `.env.local` = Local development (uses `localhost`)

## Debugging

### Backend

```bash
make debug-backend
```

Then in VSCode: F5 → Select "Debug: Backend"

### Hot Reload

- Backend: Automatic recompilation on save (~1-2s)
- Frontend: HMR enabled (< 500ms)

## Troubleshooting

### Port already in use

```bash
lsof -i :5433  # or :9000, :3000, :5173
make stop
```

### Corrupted database

```bash
make clean
make dev
```

### Build cache issues

```bash
cd backend && rm -rf dist
cd frontend && rm -rf .vite dist
make build
```
