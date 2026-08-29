# Permissions

Initial permission families:

- `campus.read`, `campus.write`
- `learner.read`, `learner.write`
- `enrollment.read`, `enrollment.write`
- `cohort.read`, `cohort.write`
- `staff.read`, `staff.write`
- `exam.read`, `exam.manage`, `exam.grade`
- `attendance.read`, `attendance.write`
- `analytics.read`
- `agent.use`

Sensitive mutations should produce an audit event containing actor, action, entity, timestamp and relevant before/after information.

Campus permissions are evaluated with the actor's campus scope. `campus.read` limits listing, detail and search results to visible campuses. `campus.write` covers campus creation, modification and deactivation; unrestricted management is reserved for the national administration until an organizational scope for creating new campuses is defined. A missing campus scope must never be interpreted as access to all campuses.

## Local development fixtures

The default Docker development identity is a deterministic `National admin` fixture represented by
verified claims, not by a role-name check in application code:

| Fixture | Permissions | Campus scope | Purpose |
| --- | --- | --- | --- |
| `local-national-admin` | `campus.read`, `campus.write` | Explicitly unrestricted | Default real Campus UI journey after `docker compose up` |
| `local-campus-director` | Explicitly selected campus permissions | One or more explicit `campusIds` | Scope and permission denial tests |

These fixtures exist only to make local development and automated checks repeatable. They are
signed server-side with development-only session material and are never a production identity
source. The application authorizes the verified permission set and resolved scope, never the
fixture name or a client-provided header. The default fixture token is created by
`scripts/create-local-session.mjs` during the web container startup, expires after one hour, and is
held only in the Next.js server environment. Profile selection, when needed for an authorization
test, is an operator-side startup configuration; the browser cannot select an identity or receive a
secret. Missing scope means no campus access, not unrestricted access.
