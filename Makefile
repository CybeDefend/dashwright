.PHONY: help dev dev-backend dev-frontend stop status logs clean install build test

help: ## Show all available commands
	@echo "Dashwright - Available Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""

dev: ## Start PostgreSQL and MinIO
	@docker-compose up -d postgres minio
	@cp .env.local backend/.env 2>/dev/null || true
	@cp .env.local frontend/.env 2>/dev/null || true
	@echo "Services started. Run in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

dev-backend: ## Start backend in watch mode
	@cd backend && pnpm run start:dev

dev-frontend: ## Start frontend in watch mode
	@cd frontend && pnpm run dev

debug-backend: ## Start backend in debug mode (port 9229)
	@cd backend && pnpm run start:debug

stop: ## Stop all Docker services
	@docker-compose down

restart: ## Restart Docker services
	@docker-compose restart

status: ## Show services status
	@docker-compose ps

logs: ## Show all logs
	@docker-compose logs -f

logs-postgres: ## Show PostgreSQL logs
	@docker logs -f dashwright-postgres

logs-minio: ## Show MinIO logs
	@docker logs -f dashwright-minio

clean: ## Clean Docker volumes (⚠️  data loss)
	@read -p "This will delete all Docker volumes. Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "Volumes deleted"; \
	else \
		echo "Cancelled"; \
	fi

install: ## Install all dependencies
	@cd backend && pnpm install
	@cd frontend && pnpm install
	@cd integrations/npm-package && pnpm install

build: ## Build backend and frontend
	@cd backend && pnpm run build
	@cd frontend && pnpm run build

test: ## Run all tests
	@cd backend && pnpm run test
	@cd frontend && pnpm run test

lint: ## Lint all code
	@cd backend && pnpm run lint
	@cd frontend && pnpm run lint

format: ## Format code with Prettier
	@cd backend && pnpm run format
	@cd frontend && pnpm run format

prod-up: ## Start all services in production mode
	@docker-compose up -d
	@echo "Services started:"
	@echo "  Frontend: http://localhost:3007"
	@echo "  Backend: http://localhost:3006"
	@echo "  MinIO Console: http://localhost:9001"

prod-build: ## Build Docker images
	@docker-compose build

prod-down: ## Stop and remove all containers
	@docker-compose down

db-shell: ## Open PostgreSQL shell
	@docker exec -it dashwright-postgres psql -U dashwright

db-migrate: ## Run database migrations
	@cd backend && pnpm run migration:run

.DEFAULT_GOAL := help
