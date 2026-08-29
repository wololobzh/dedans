# ADR-006: Local HMAC session bootstrap

## Status

Accepted

## Context

The Campus API already verifies HMAC bearer sessions, but the development Compose file injects an
empty `API_SESSION_SECRET` and an empty `API_SESSION_TOKEN`. There is no product login or issuer,
and the browser must not hold authentication material.

## Decision

Keep authentication infrastructure-only for local development. Add
`scripts/create-local-session.mjs`, a small Node script using the platform crypto API. The `web`
container invokes it during startup with `LOCAL_SESSION_SECRET`, exports the returned token as its
server-only `API_SESSION_TOKEN`, and then starts Next.js. Compose resolves `LOCAL_SESSION_SECRET`
from the same development default or explicit override expression used for the API's
`API_SESSION_SECRET`.

The script emits an HMAC-SHA256 token with the explicit national-admin claims, a one-hour `exp`,
and a local correlation ID. It supports a server-side operator fixture setting for the scoped
campus-director claims used by tests. It does not expose a login endpoint, set a browser cookie, or
accept browser profile/authorization headers.

The Next.js proxy forwards only `Authorization: Bearer <API_SESSION_TOKEN>` to NestJS. The guard
verifies the signature, expiry, permission claims and explicit scope. Missing scope is no access;
unrestricted access requires the explicit national-administration claim.

## Production boundary

The local script and its default secret are development-only. Compose exposes a configurable
`NODE_ENV` to API and web, defaulting to `development`; only development invokes the local script.
Production web configuration must require a non-empty external `API_SESSION_TOKEN`, while API
configuration must reject the default or missing secret. Production therefore fails closed rather
than selecting a local identity. A missing web session returns `503`; a missing or invalid API
bearer returns `401`.

## Consequences

`docker compose up` works without `.env`, and the real browser-to-Next.js-to-NestJS path is
verifiable. The token expires naturally and is refreshed by restarting/recreating `web`. This is a
local fixture, not a replacement for the future identity provider and login flow.