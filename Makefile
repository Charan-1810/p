.PHONY: help dev build test lint clean docker-up docker-down migrate

# Default target
help: ## Show this help message
	@echo "\n\033[1mAI Codebase Explainer — Makefile\033[0m\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─── Environment ─────────────────────────────────────────────
setup: ## Install all dependencies
	npm install
	@echo "✓ Dependencies installed"

env: ## Copy .env.example to .env
	@if [ ! -f .env ]; then cp .env.example .env && echo "✓ .env created — edit it with your secrets"; else echo "⚠ .env already exists"; fi

# ─── Docker ──────────────────────────────────────────────────
infra-up: ## Start infrastructure services only (DB, Redis, etc.)
	docker-compose up -d postgres redis neo4j qdrant typesense minio
	@echo "✓ Infrastructure services started"

infra-down: ## Stop infrastructure services
	docker-compose stop postgres redis neo4j qdrant typesense minio

docker-up: ## Start all services with Docker Compose
	docker-compose up -d --build

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## Tail all Docker logs
	docker-compose logs -f

docker-clean: ## Remove all containers, volumes, and orphans
	docker-compose down -v --remove-orphans
	@echo "✓ All containers and volumes removed"

docker-ps: ## Show running containers
	docker-compose ps

# ─── Development ─────────────────────────────────────────────
dev: infra-up ## Start infrastructure + all backend services in dev mode
	npm run dev:backend &
	npm run dev:frontend

dev-local: ## Start backend + frontend (skips Docker — use when Postgres/Redis/Neo4j run natively)
	npm run dev:backend &
	npm run dev:frontend

dev-backend: ## Start all backend services in dev mode
	npm run dev:backend

dev-frontend: ## Start frontend in dev mode
	cd frontend && npm run dev

# ─── Build ───────────────────────────────────────────────────
build: ## Build all packages
	npm run build

build-frontend: ## Build frontend only
	cd frontend && npm run build

# ─── Testing ─────────────────────────────────────────────────
test: ## Run all tests
	npm run test

test-backend: ## Run backend tests only
	npm run test --workspace=backend/services/auth-service
	npm run test --workspace=backend/services/repo-service
	npm run test --workspace=backend/services/parser-service
	npm run test --workspace=backend/services/graph-service
	npm run test --workspace=backend/services/ai-service

test-coverage: ## Run tests with coverage
	npm run test:coverage --workspaces --if-present

# ─── Database ────────────────────────────────────────────────
migrate: ## Run all database migrations
	@echo "Running migrations..."
	@for service in auth-service repo-service parser-service graph-service; do \
		echo "Migrating $$service..."; \
		npm run migrate --workspace=backend/services/$$service 2>/dev/null || true; \
	done

db-reset: ## Reset database (WARNING: destroys data)
	@echo "⚠ This will destroy all data! Press Ctrl+C to abort..."
	@sleep 3
	docker-compose exec postgres psql -U aceuser -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) migrate

# ─── Code Quality ────────────────────────────────────────────
lint: ## Run linter across all packages
	npm run lint

lint-fix: ## Auto-fix linting errors
	npm run lint:fix --workspaces --if-present

format: ## Format code with Prettier
	npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" --ignore-path .gitignore

# ─── Utilities ───────────────────────────────────────────────
clean: ## Remove all build artifacts and node_modules
	find . -name "dist" -type d -not -path "*/node_modules/*" | xargs rm -rf
	find . -name ".next" -type d | xargs rm -rf
	find . -name "node_modules" -type d -maxdepth 3 | xargs rm -rf
	@echo "✓ Clean complete"

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -sf http://localhost:4000/health && echo "✓ API Gateway" || echo "✗ API Gateway"
	@curl -sf http://localhost:4001/health && echo "✓ Auth Service" || echo "✗ Auth Service"
	@curl -sf http://localhost:4002/health && echo "✓ Repo Service" || echo "✗ Repo Service"
	@curl -sf http://localhost:4003/health && echo "✓ Parser Service" || echo "✗ Parser Service"
	@curl -sf http://localhost:4004/health && echo "✓ Graph Service" || echo "✗ Graph Service"
	@curl -sf http://localhost:4005/health && echo "✓ Search Service" || echo "✗ Search Service"
	@curl -sf http://localhost:4006/health && echo "✓ AI Service" || echo "✗ AI Service"

logs-service: ## Tail logs for a specific service (usage: make logs-service S=auth-service)
	docker-compose logs -f $(S)
