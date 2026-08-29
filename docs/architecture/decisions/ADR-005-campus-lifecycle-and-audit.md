# ADR-005 — Durable campus lifecycle and transactional audit

Status: Proposed

## Context

Campus is referenced by operational and historical domains. Product requires active/inactive
status, forbids physical deletion, blocks new associations to inactive campuses, and requires
an audit record for creation, modification and deactivation. Authorization is permission-based
and campus-scoped.

## Decision

Model Campus as a durable reference entity with a stable identifier and a non-destructive
`active | inactive` lifecycle. Deactivation records timestamp, actor and reason on the campus,
while historical associations remain unchanged. Reactivation is not part of MVP. Campus type is
`physical` or `virtual`; physical campuses require a non-blank city, while virtual campuses may
store a null city. Timezones are validated as IANA identifiers at the domain boundary and in the
database constraint.

Persist each successful campus mutation and its `AuditEvent` in one PostgreSQL transaction.
Audit events use structured before/after snapshots and are append-only: the application exposes
only an append port, and no campus operation can edit or delete an event.

Enforce campus scope in application use cases using `campus.read` and `campus.write`. Missing or
empty `campusIds` means no scoped access. Unrestricted creation is limited to the national
administration until an organization-level creation scope exists.

Use database uniqueness constraints for the normalized campus code and active campus name;
application validation remains responsible for user-facing normalization and business errors.

## Consequences

- Historical reports can resolve inactive campus identity and labels.
- Every domain creating a new campus association must call an active-campus guard in its own
  transaction; Campus cannot rely on a UI check.
- Deactivation uses a `CampusDeactivationDependencyChecker` port inside the existing serializable
  transaction. `PrismaCampusTransaction` supplies a checker bound only to its callback's
  `Prisma.TransactionClient`. The checker locks the campus row with `FOR UPDATE` before querying
  active cohorts and active enrollments, using `startsAt <= now` and an open or future `endsAt`
  window. Its result is `clear`, `blocked` with dependency categories, or `unavailable`; blocked
  and unavailable results leave both campus and audit unchanged, and infrastructure details are
  not exposed.
- Audit retention, access to audit history and archival are operational policies not included in
  the campus CRUD MVP.

## Open decisions before implementation

- Define whether future exam sessions and open staff assignments also block deactivation, and
  which domain owns each check. Active cohorts and active enrollments are covered by the current
  Prisma adapter.
- Confirm whether inactive campus names may be reused. The conservative default is no.
- The initial timezone contract is the IANA timezone identifier stored on Campus.