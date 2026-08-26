# Repository instructions

You are contributing to **School ERP**, a multi-campus education management system developed with a team of specialized GitHub Copilot agents.

## Architecture

- TypeScript monorepo using pnpm workspaces.
- Modular monolith first.
- Next.js frontend in `apps/web`.
- NestJS API in `apps/api`.
- Domain rules in `packages/domain`.
- Use cases in `packages/application`.
- Persistence in `packages/database`.
- PostgreSQL is the source of truth.
- There are **no runtime AI agents inside the ERP**. `.github/agents` exists only to assist software development.

## Mandatory rules

1. Business rules never live in React components.
2. Never duplicate an existing domain concept under a different name.
3. Every sensitive mutation must be authorized and auditable.
4. Every metric must have a documented business definition.
5. Prefer explicit code over magic abstractions.
6. Keep modules small and domain-oriented.
7. Avoid microservices until a concrete scaling or ownership problem requires them.
8. Update documentation when domain behavior changes.
9. Do not add LLM, Copilot SDK, agent runtime, prompt orchestration or AI features to the product unless a future product decision explicitly changes this rule.

## Before coding

Read, as relevant:

- `AGENTS.md`
- `docs/product/glossary.md`
- `docs/architecture/overview.md`
- the corresponding file under `docs/domains/`

## TypeScript

- Strict TypeScript.
- Avoid `any`.
- Validate external inputs.
- Prefer immutable input DTOs and explicit return types for public APIs.
- Domain types should not depend on NestJS, Next.js or Prisma.

## Boundaries

- `apps/web` talks to the API, never directly to the database.
- `apps/api` invokes application use cases.
- `packages/application` orchestrates use cases and depends on domain contracts.
- `packages/domain` contains business concepts and rules and remains framework-independent.
- `packages/database` implements persistence adapters and owns Prisma infrastructure.

## Docker-first local development

- The complete local application MUST start with `docker compose up` from the repository root.
- Do not require host-installed Node.js, pnpm, PostgreSQL, Redis, queues, or other runtime services for normal local startup.
- Any new infrastructure dependency required by a feature MUST be represented as a Docker Compose service.
- Services MUST expose health checks when other services depend on their readiness.
- Application containers MUST use Compose service names for internal networking; browser-facing URLs may use localhost ports exposed by Compose.
- A feature is not complete if it breaks the one-command local startup contract.
