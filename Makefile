# Quality gates. The target names are the contract with CI (harness/quality-gates.md).
# sast, deps, check and help come from harness/gates.mk.
#
# Frontend: Angular in frontend/ (Node from .nvmrc, pnpm). Backend: Quarkus in backend/ (Java 21,
# Maven wrapper). On macOS JAVA_HOME defaults to the installed Java 21.

include harness/gates.mk

JAVA_HOME ?= $(shell /usr/libexec/java_home -v 21 2>/dev/null)
ifneq ($(strip $(JAVA_HOME)),)
export JAVA_HOME
endif

MVN  := cd backend && ./mvnw -q -B -ntp
PNPM := pnpm --dir frontend

.PHONY: test typecheck lint install frontend-test backend-test frontend-typecheck backend-typecheck frontend-lint backend-lint format dev-frontend dev-backend

install: ## Install the frontend dependencies
	$(PNPM) install --frozen-lockfile

test: frontend-test backend-test ## Unit and integration tests

typecheck: frontend-typecheck backend-typecheck ## Static type check

lint: frontend-lint backend-lint ## Style and static rules

frontend-test:
	$(PNPM) exec ng test --watch=false

backend-test:
	$(MVN) test

frontend-typecheck:
	$(PNPM) exec tsc -p tsconfig.app.json --noEmit
	$(PNPM) exec tsc -p tsconfig.spec.json --noEmit

backend-typecheck:
	$(MVN) -DskipTests test-compile

frontend-lint:
	$(PNPM) exec ng lint
	$(PNPM) exec prettier --check src

backend-lint:
	$(MVN) spotless:check

format: ## Format frontend and backend
	$(PNPM) exec prettier --write src
	$(MVN) spotless:apply

dev-frontend: ## Start the frontend dev server on http://localhost:4200
	$(PNPM) start

dev-backend: ## Start Quarkus in dev mode on http://localhost:8080
	cd backend && ./mvnw quarkus:dev
