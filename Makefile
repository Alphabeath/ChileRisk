# ChileRisk — Monorepo convenience targets
#
# Docker is the supported full-stack development and deployment method
# (see root AGENTS.md and docker-compose.yml).
#
# These targets reduce "cd frontend && ..." friction while respecting
# the per-area boundaries (frontend/ and backend/ own their code).
#
# Usage:
#   make help
#   make up
#   make clean
#   make dev-frontend
#
# Prerequisites: docker, docker compose, make, bun (for native frontend dev), and python3 (for native backend dev).

.PHONY: help up down logs build build-frontend build-backend clean \
        dev-frontend dev-backend \
        backend-sh psql adminer \
        check-ignores \
        verify verify-docs verify-contract verify-frontend verify-backend \
        export-openapi sync-contract \
        db-migrate db-revision db-stamp

.DEFAULT_GOAL := help

help: ## Show this help
	@echo "ChileRisk monorepo (structured)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make up                  # full stack (build + run)"
	@echo "  make clean               # remove host-side Python caches"
	@echo "  make dev-frontend        # native Next.js dev (cd frontend + bun)"

# --- Full stack (Docker blessed path) ---

up: ## docker compose --profile tools up --build (incl. Adminer local)
	docker compose --profile tools up --build

down: ## docker compose down (keeps volumes unless -v)
	docker compose --profile tools down

down-v: ## docker compose down -v (wipes DB volume — destructive)
	docker compose --profile tools down -v

logs: ## Follow logs for all services
	docker compose --profile tools logs -f

logs-backend: ## Follow backend logs only
	docker compose logs -f backend

build: ## Build images without starting
	docker compose build

build-frontend: ## Rebuild only the frontend image (no deps)
	docker compose build --no-deps frontend

build-backend: ## Rebuild only the backend image (no deps)
	docker compose build --no-deps backend

# --- Hygiene / caches (directly addresses original .pyc / __pycache__ issue) ---

clean: ## Remove __pycache__ and .pyc from the host tree (defense in depth)
	@echo "Cleaning Python caches..."
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -name '*.pyc' -o -name '*.pyo' -delete 2>/dev/null || true
	@echo "Done. (backend/.gitignore + backend/.dockerignore + root .gitignore now protect the rest)"

clean-docker: ## Prune dangling images / build cache (use with care)
	docker system prune -f

# --- Native dev shortcuts (when you don't want the full Docker stack) ---

dev-frontend: ## cd frontend && bun run dev (uses the standardized bun lock)
	cd frontend && bun run dev

dev-backend: ## Run backend with uvicorn --reload (assumes DB available; see backend/.env.example)
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# --- Convenience accessors ---

backend-sh: ## Shell into the running backend container
	docker compose exec backend /bin/bash

psql: ## psql into the running Postgres (as chilerisk user)
	docker compose exec db psql -U chilerisk -d chilerisk

adminer: ## Remind how to reach Adminer (started automatically with compose)
	@echo "Adminer should be at http://localhost:8080"
	@echo "Server: db | User: chilerisk | Pass: chilerisk | DB: chilerisk"

# --- Database migrations (Alembic) ---

db-migrate: ## Run alembic upgrade head (inside backend container, or local venv)
	@if docker compose ps --status running --services 2>/dev/null | grep -qx backend; then \
		docker compose exec backend alembic upgrade head; \
	else \
		cd backend && alembic upgrade head; \
	fi

db-revision: ## Autogenerate revision: make db-revision MSG="describe change"
	@test -n "$(MSG)" || (echo 'Usage: make db-revision MSG="describe change"' >&2; exit 1)
	cd backend && alembic revision --autogenerate -m "$(MSG)"

db-stamp: ## Stamp DB at head (legacy volumes already matching schema)
	@if docker compose ps --status running --services 2>/dev/null | grep -qx backend; then \
		docker compose exec backend alembic stamp head; \
	else \
		cd backend && alembic stamp head; \
	fi

# --- Verification helpers (monorepo structure) ---

check-ignores: ## Quick test that key ignore rules are working
	@echo "Testing root + backend/.gitignore for caches (defense in depth)..."
	@git check-ignore -v --no-index __pycache__/ backend/app/services/risk_service.py 2>/dev/null | head -3 || true
	@git check-ignore -q frontend/bun.lock 2>/dev/null && echo "ERROR: bun.lock is being ignored (should be committed)" || echo "Good: bun.lock is not ignored (correctly tracked as the source of truth)"
	@echo "Run: git status --porcelain | grep -E '(__pycache__|\.pyc|bun\.lock)'  (should be empty for these)"
	@echo "Also try: make clean && python -c 'import backend.app.services.risk_service' 2>/dev/null; git status --porcelain | grep -E pycache"

# Note: for full verification after changes run:
#   docker compose build --no-cache
#   docker compose exec backend sh -c 'find /app -name __pycache__ | head -5'
# Both should show no (or very few runtime) caches inside the image.

# --- Harness verification (agents + CI-friendly) ---

verify: verify-docs verify-contract verify-frontend verify-backend ## Full harness gate
	@echo "verify: all checks passed"

verify-docs: ## Markdown local links in AGENTS + docs trees
	@bash docs/scripts/verify-doc-links.sh

verify-contract: ## OpenAPI → api-schema.d.ts must match committed file
	@bash docs/scripts/sync-contract.sh

verify-frontend: ## eslint + TypeScript + unit tests (requires bun in frontend/)
	@cd frontend && bun run lint
	@cd frontend && bunx tsc --noEmit
	@cd frontend && bun test

verify-backend: ## Python syntax compile (pytest if installed)
	@cd backend && python3 -m compileall -q app
	@if command -v pytest >/dev/null 2>&1; then \
		cd backend && python3 -m pytest tests/ -q --tb=line; \
	else \
		echo "verify-backend: pytest not installed — skipped (use Docker: docker compose exec backend python -m pytest tests/ -q)"; \
	fi

export-openapi: ## Write backend/docs/openapi.json from FastAPI app (needs backend deps)
	@ENABLE_SCHEDULER=false $(if $(wildcard backend/.venv/bin/python),backend/.venv/bin/python,python3) docs/scripts/export-openapi.py

sync-contract: ## Export OpenAPI + write frontend/lib/api-schema.d.ts
	@SYNC_CONTRACT_WRITE=1 bash docs/scripts/sync-contract.sh