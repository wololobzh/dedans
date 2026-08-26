# Architecture overview

## Style

Modular monolith with explicit domain and application boundaries.

```text
Browser
  |
Next.js Web
  |
NestJS API
  |
Application use cases
  |
Domain
  |
Repository ports
  |
Database adapters / Prisma
  |
PostgreSQL
```

## Important distinction

`.github/agents/` contains GitHub Copilot development agents. These files help developers build the repository and are not part of the runtime architecture.

There is intentionally no runtime AI layer and no `packages/ai` package.

## Dependency rule

Dependencies point inward toward domain/application contracts. Domain must not import framework or infrastructure packages.

## Why modular monolith

- fast iteration;
- simple transactions;
- simpler operations;
- domain boundaries can still be enforced;
- future services can be extracted only when justified.

## Local runtime

See `docs/architecture/docker.md`. The development environment is Docker-first and must start with `docker compose up`.
