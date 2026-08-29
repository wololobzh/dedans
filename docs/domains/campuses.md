# Campuses domain

## Objective and scope

A Campus represents an operational school location or virtual campus. Campus management provides the authoritative list of places in which the school operates and the lifecycle state used by cohorts, staff assignments, permissions and analytics.

This feature covers:

- listing campuses, with an explicit active/inactive filter;
- consulting one campus and its operational references;
- creating a campus;
- modifying its descriptive and operational attributes;
- deactivating a campus without physical deletion or loss of history.

It does not cover campus-specific configuration, transfers, cohort management, staff assignment management or campus merging. Those workflows must consume this domain's campus identity and lifecycle state.

## Users

- **National admin**: manages the complete campus directory.
- **Campus director**: manages campuses within the campuses explicitly assigned to the actor, subject to the final permission grant.
- **Pedagogical manager, SWE / trainer, exam manager and read-only analyst**: consult campuses when their authorized workflows require the campus dimension; they do not manage the directory by default.

Roles are product concepts. The application must authorize permissions and campus scope, not role names alone.

## Campus data

The product contract requires:

- stable identifier;
- official name;
- campus type: physical or virtual;
- address or location details when the type is physical;
- timezone, using an explicit school-supported timezone identifier;
- deactivation timestamp and actor when inactive.

The exact address fields and identifier format are an architecture decision. A campus name is not an identifier and may not be used as a foreign key.

## Business rules

1. A newly created campus is active by default.
2. The official name is required, trimmed and unique among active campuses. Name comparison is case-insensitive and must not allow whitespace-only values.
3. `type` is either `physical` or `virtual`. A physical campus requires a non-blank city; a virtual campus may have a null city.
4. The timezone is required and must be a valid IANA timezone identifier. Timezone is part of date/time interpretation for attendance, sessions and operational reporting.
5. Deactivation is a reversible lifecycle change, not a physical delete. The deactivation reason is required and must be retained.
6. An inactive campus cannot receive new cohorts, enrollments, staff assignments or other new operational associations. Existing associations remain queryable and historically attributable to that campus.
7. Deactivation does not rewrite, cancel or close existing cohorts, enrollments, assignments, exam sessions or attendance records. Each affected domain owns its own transition rules.
8. Re-activation is out of the initial write scope. If required, it must be an explicit, separately authorized action with its own audit event and validation of current dependencies.
9. A campus cannot be deactivated if a dependent workflow explicitly requires an active campus, unless that dependency supplies a documented transition/closure rule. The check must be transactional to avoid a race with new associations. The application checker returns `clear`, `blocked` or `unavailable`; `unavailable` fails closed and performs no campus or audit mutation.
10. Modification must not change the stable identity or rewrite historical references. Name, code and city remain modifiable with resulting-state validation. In the MVP, changing type or timezone is rejected with `InvalidCampusError` before persistence or audit; a future approved impact policy must define downstream handling before either field becomes mutable.

## Authorization and scope

The permission families are:

- `campus.read`: list and consult campuses visible in the actor's campus scope;
- `campus.write`: create, modify and deactivate campuses within the actor's authorized management scope.

The national admin is the only default role with unrestricted campus management. A scoped grant must include one or more `campusIds`; an empty or missing scope must not silently mean all campuses. Creating a campus requires an explicitly defined administrative scope because the new campus has no existing ID; the initial implementation should allow this only for unrestricted administrators unless a parent organizational scope is introduced.

Read access must not expose campuses outside the actor's scope, including through detail endpoints, search, counts or error messages. A write operation must re-check both permission and scope in the application use case. Database adapters must not broaden either boundary.

### Session and unauthenticated behavior

Campus requests use the shared session boundary. The browser calls the same-origin Next.js route;
Next.js forwards only its server-side `API_SESSION_TOKEN` to NestJS as a bearer token. The browser
does not hold, mint or select the actor, permissions or campus scope.

For local Docker development, the default verified identity is the deterministic
`local-national-admin` fixture described in the security and Docker architecture documents. It
exists only to exercise the real Campus workflow without a login endpoint. A scoped
`local-campus-director` fixture is used to prove that permission and campus-scope restrictions
remain active.

The local token is signed by `scripts/create-local-session.mjs` inside the web container at startup,
with the same server-only secret supplied to the API. It expires after one hour and is refreshed by
restarting the web container. An optional profile is selected by the operator before startup, never
by a browser request, cookie, or header.

Unauthenticated behavior is explicit: a missing web token is a `503` from the Next.js proxy because
the server session is unavailable; a missing or invalid bearer at NestJS is `401`; a valid actor
without `campus.read`/`campus.write` is `403`; and an out-of-scope campus identifier follows the
not-found boundary without existence disclosure. Production never uses the local fixture or an
empty secret as a fallback.

## Audit requirements

Every create, modify and deactivate operation produces an audit event containing:

- actor/user identifier;
- action (`campus.created`, `campus.updated`, `campus.deactivated`);
- campus identifier;
- timestamp;
- authorized scope used for the decision;
- relevant before/after values, excluding secrets (campuses contain none by default);
- deactivation reason when applicable;
- request/correlation identifier when available.

Failed authorization and validation attempts should be observable in security logs without exposing data outside the actor's scope. Audit records are append-only and must survive campus deactivation.

## Edge cases

- An inactive campus is omitted from the default list but remains discoverable by authorized historical lookup and an explicit inactive filter.
- A duplicate active name must be rejected deterministically; inactive names may be retained, so reusing a name requires an explicit product decision and must not make historical screens ambiguous.
- Deactivation submitted twice is idempotent only if the same inactive state and reason are returned without creating a second state change event; a new request may still be logged as an attempted mutation according to audit policy.
- Updating an inactive campus is restricted to correcting descriptive data or a future reactivation flow; it must not make the campus operational implicitly.
- Concurrent create/update/deactivate requests must preserve uniqueness and lifecycle invariants transactionally.
- Existing reports must continue to resolve an inactive campus label and status.
- A campus with active enrollments, future sessions or open assignments needs a dependency policy before the write path is implemented; the domain must not silently orphan those records.

## Acceptance criteria

### Real local Docker journey

- From a fresh clone with no `.env`, `docker compose up` starts PostgreSQL, API and web healthy.
- Opening the web application and loading the Campus list calls same-origin `/api/campuses` and
	returns the authorized active-campus result, rather than `503` or `401`.
- The browser request contains no session secret or bearer token; the Next.js server forwards the
	configured local token to NestJS, which verifies its HMAC and claims before the use case runs.
- The local national-admin fixture can list and create a valid campus, subject to the normal
	Campus validation and audit rules.
- Replacing the local fixture with a scoped actor demonstrates that an out-of-scope campus is not
	listed or disclosed and that missing permissions are rejected.
- Removing the web token produces `503`; sending no bearer directly to the API produces `401`.
- With production configuration, missing or empty session material fails closed and never enables
	an implicit local identity.

### List

- An authorized actor can list campuses in scope.
- The default result contains active campuses only and has deterministic ordering, preferably official name then stable identifier.
- An explicit inactive/all filter is available only when authorized and does not bypass scope.
- An unauthorized actor is rejected, and an out-of-scope campus is not disclosed through filtering or pagination.

### Consult

- An authorized actor can retrieve an in-scope campus by stable identifier, including type, timezone and lifecycle status.
- An authorized historical lookup can retrieve an inactive campus and its deactivation metadata.
- A missing or out-of-scope identifier does not reveal whether the campus exists.

### Create

- An actor with `campus.write` and the required unrestricted scope can create a valid physical or virtual campus.
- Invalid name, duplicate active name, invalid timezone, or missing/contradictory location data is rejected without persistence.
- The campus is active by default and the creation audit event contains actor, timestamp and after-state.

### Modify

- An authorized actor can update allowed descriptive fields without changing the stable identifier or historical references.
- Validation and active-name uniqueness apply to the resulting state.
- A modification of type or timezone is rejected in the MVP with `InvalidCampusError`, without persistence or a mutation audit event.
- The update audit event records the relevant before/after values.

### Deactivate

- An authorized actor can request deactivation with a reason.
- The operation preserves the campus row/identity, historical associations and audit history.
- New operational associations are blocked after deactivation, while existing records remain readable under their owning domains.
- Dependency conflicts return a clear business error and leave the campus active.
- The deactivation audit event records actor, timestamp, reason and before/after lifecycle state.

## Impacts on existing domains and documentation

- **Cohorts, enrollments and staff**: reject new associations with inactive campuses; preserve existing references.
- **Exams and attendance**: retain campus attribution for historical sessions/records and apply each domain's own date/time rules.
- **Analytics**: include active/inactive status in campus dimensions and keep historical metrics resolvable; document whether operational views exclude inactive campuses.
- **Authorization**: add `campus.read` and `campus.write`, with explicit campus scope.
- **API/application/database**: the application owns the dependency-check port and executes it in the existing serializable campus transaction before deactivation. The Prisma adapter receives only that transaction's `Prisma.TransactionClient`, locks the campus row with `Campus FOR UPDATE`, then checks active cohorts and active enrollments using one reference time. It returns `blocked` categories (`active_cohorts`, `active_enrollments`) or `clear`; infrastructure failures return `unavailable` without exposing the underlying error.
- **Documentation**: update domain contracts and metric definitions when downstream behavior is decided; add a campus workflow once the write sequence and dependency handling are approved.

## Open questions / blockers for Architect

The current checker covers exactly two blocking categories: `active_cohorts` and
`active_enrollments`. Exam sessions and staff assignments are intentionally outside this adapter
and do not currently block deactivation; their owning domains must define the relevant state,
scope and transactional transition before those categories can be added. Deactivation also does
not rewrite or close exam, attendance or staff history.

1. What address fields and timezone catalog are required for physical campuses?
2. Can active and inactive campuses reuse the same official name, or must names be historically unique?
3. Which dependencies block deactivation: active enrollments, open cohorts, future exam sessions, active assignments, or another set?
4. Is reactivation required for MVP, and who may perform it?
5. What organization-level scope, if any, permits a scoped campus director to create a new campus?
6. Where is the append-only audit event stored, and what fields are mandatory for correlation and retention?
