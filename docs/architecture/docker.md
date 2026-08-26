# Docker-first local architecture

## Contract

From a fresh clone, the complete local application is started with:

```bash
docker compose up
```

No host-side Node.js, pnpm, PostgreSQL or `.env` setup is required for the default development environment.

## Services

```text
web :3000
  ↓
api :3001
  ↓
postgres :5432

postgres healthy
  ↓
db-init (Prisma generate + db push)
  ↓
api healthy
  ↓
web
```

`db-init` is an ephemeral initialization service. It exits successfully before the API starts.

## Rules

- Service-to-service networking uses Docker Compose DNS names.
- Browser-facing endpoints use exposed localhost ports.
- Infrastructure additions must be expressed in Compose.
- Dependencies must use health checks/readiness conditions where appropriate.
- `.env` is optional and used only to override defaults.
