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
db-init (Prisma generate + migrations, with partial-schema repair)
  ↓
api healthy
  ↓
web
```

`db-init` is an ephemeral initialization service. It exits successfully before the API starts.

The initializer decides from PostgreSQL introspection and `_prisma_migrations`, never from
the presence of application tables. Partially provisioned databases are compared with the
complete Prisma datamodel using `prisma migrate diff` before migration records are resolved.
A complete migration history with a missing or drifted object fails startup.

The final check requires lifecycle constraints, the partial unique active-campus-name index,
audit indexes, and both append-only `AuditEvent` triggers.

## Rules

- Service-to-service networking uses Docker Compose DNS names.
- Browser-facing endpoints use exposed localhost ports.
- Infrastructure additions must be expressed in Compose.
- Dependencies must use health checks/readiness conditions where appropriate.
- `.env` is optional and used only to override defaults.

## Development authentication contract

`docker compose up` must make the authenticated Campus read path usable from a fresh clone. The
Compose development profile therefore supplies the API and web services with matching local-only
session material:

- the API receives a non-empty development `API_SESSION_SECRET`;
- the web service receives the same resolved value as server-only `LOCAL_SESSION_SECRET`;
- the web startup command runs `scripts/create-local-session.mjs` with that value and exports its
  signed output as `API_SESSION_TOKEN` before starting Next.js;
- the token claims identify `local-national-admin`, grant `campus.read` and `campus.write`, and
  explicitly grant unrestricted campus management;
- token creation happens inside the development startup path or an equivalent development-only
  fixture, not in the browser and not through a product login endpoint.

The script signs the exact claims with HMAC-SHA256, sets `exp` to one hour after startup, and exits
non-zero on a missing secret or invalid fixture. Deriving the token in the web startup command from
the same Compose expression as the API makes a mismatched secret/token pair impossible under the
default path; an explicit operator override remains one value to change. Restarting the web
container refreshes the token.

Compose exposes `NODE_ENV` to both application services, defaulting to `development` when no `.env`
file is present. `scripts/run-service.sh` selects the runtime command from that value. Development
generates the local session and runs the watchers/dev commands. Production builds the API and web
artifacts first, then runs `api start` and `next start`; it never invokes the local-session script.
Production deployment must inject an explicit API secret and a non-empty server-side
`API_SESSION_TOKEN`. Compose passes separate external-material markers so the production launcher
can distinguish an injected value from the development default and fails startup otherwise. The API
may be healthy at `/health` while
Campus requests remain unauthorized; health is not an authentication readiness signal.

## Browser-to-API behavior

The browser calls only same-origin `/api/campuses/*`. Next.js reads `API_SESSION_TOKEN` on the
server and forwards it as `Authorization: Bearer <token>` to the Compose `api` service. It must not
forward arbitrary browser authorization headers or expose the token or development secret to client
code. The local fixture uses no browser cookie. Missing web token returns `503`; an invalid forwarded
token returns the API's `401`; a valid token rejected by Campus permission/scope checks returns
`403` or the documented not-found boundary.
