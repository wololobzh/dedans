# Security baseline

- Authentication at API boundary.
- Authorization at application/use-case boundary.
- Least-privilege tools for runtime agents.
- No secrets in prompts, logs or repository.
- Audit sensitive mutations.
- Treat agent/tool input as untrusted input.
- Never use model output as authorization evidence.
- Personally identifiable learner data should be returned only when the caller has permission and a legitimate product path.

The campus API accepts an actor only from a verified HMAC session bearer token. Missing or invalid
`API_SESSION_SECRET`, missing tokens, expired tokens and invalid claims fail closed. Client headers
are never an authority source. Roles are not authorization evidence: verified claims carry the user
identifier, exact permissions and the explicit campus scope (or explicit unrestricted national
administration).

The Next.js campus proxy keeps the bearer token server-side in `API_SESSION_TOKEN`; browser code
calls only the same-origin `/api/campuses/*` routes. The request chain is:

```text
browser -> same-origin Next.js /api/campuses/*
	-> server-side Authorization: Bearer API_SESSION_TOKEN
	-> NestJS SessionAuthGuard -> verified ActorContext -> application use case
```

The browser never receives or supplies `API_SESSION_TOKEN` and cannot widen permissions or campus
scope through request headers. If the web service has no token, the proxy returns `503` without
calling the API. If the token is present but missing, expired, malformed or signed with another
secret, NestJS returns `401`. An authenticated actor without the required permission or scope gets
`403` (or the documented not-found boundary for an out-of-scope campus identifier).

## Local development identity

The development Compose profile must provide a deterministic, non-production session fixture so
the real Campus UI path works after `docker compose up` from a fresh clone without a mandatory
`.env` file. The fixture is infrastructure-only. A small Node script at
`scripts/create-local-session.mjs` is invoked by the `web` container command at startup; it
receives the resolved local development secret, signs a token, and prints only the token. Compose
resolves that secret once as the API's `API_SESSION_SECRET` and once as the web container's
server-only `LOCAL_SESSION_SECRET`, using the same default or override expression. The web command
assigns the script output to `API_SESSION_TOKEN` before starting Next.js. It must fail startup if
signing fails or if the generated token is empty.

The startup-issued HMAC token has explicit claims:

- `sub`: `local-national-admin`;
- `permissions`: `campus.read`, `campus.write`;
- unrestricted campus management: explicit `true`;
- a fresh `exp` and local correlation identifier;
- the same secret used by the API and token used by the web proxy.

The script uses a short fixed development TTL (one hour) and computes `exp` from the container
clock at each web startup, so expiry is real and stale tokens are not reused. Restarting or
recreating the web container issues a fresh token. A second scoped fixture may be produced by the
same script for authorization tests (`local-campus-director` with explicit `campusIds`), but it
must not replace the default fixture for the end-to-end startup path.

The browser has no login or profile-selection authority in this MVP. If a developer needs to choose
the scoped fixture, the choice is an operator-side Compose/script setting that changes the server
container's fixture claims; it is never a browser header, cookie value, or client-side secret. The
browser calls same-origin routes only. The proxy sends exactly one server-created
`Authorization: Bearer <API_SESSION_TOKEN>` header and does not forward a browser Authorization
header. No session cookie is required for this local fixture; a future real login may establish an
HttpOnly, Secure, SameSite cookie, but it must still be translated to a verified API bearer at the
server boundary.

Production must not invoke the local-session script or accept its default secret. API startup must
fail closed when `NODE_ENV=production` lacks a non-empty explicitly supplied
`API_SESSION_SECRET`; web startup must fail closed when its explicit server-side session material is
missing. The Compose runtime launcher validates these external-material markers before building or
starting the production processes, and production uses compiled API output plus `next start`. In
either case, no local identity fallback is allowed. A missing web token remains `503`, while a
missing or invalid API bearer remains `401`.
