# Data model V0

Core relationships:

```text
Campus 1 --- * Cohort * --- 1 Program
                  |
                  *
             Enrollment
                  *
                  |
                  1
               Learner

Staff 1 --- * StaffAssignment * --- 0..1 Cohort
                         \\--- 0..1 Campus

Exam 1 --- * ExamSession 1 --- * ExamAttempt * --- 1 Learner

Learner 1 --- * AttendanceRecord * --- 1 Cohort
```

Important: counts of learners are generally counts of qualifying enrollments at a reference date, not raw rows in `Learner`.

## Campus management architecture

`Campus` is a durable reference entity. It is never physically deleted because cohorts,
enrollments, staff assignments, exam sessions, attendance records and analytics must retain
their historical campus attribution.

### MVP model

```text
Campus
     id: string (stable technical identifier)
     name: string (trimmed display name)
     code: string (trimmed, normalized, unique business code)
     city: string | null (required for physical campuses; null allowed for virtual campuses)
     type: physical | virtual
     status: active | inactive
     createdAt: timestamp
     updatedAt: timestamp
     deactivatedAt: timestamp | null
     deactivatedBy: string | null
     deactivationReason: string | null
```

`type` distinguishes physical and virtual campuses and is required. `timezone` is a required
IANA timezone identifier. `city` is required for physical campuses and may be null for virtual
campuses. The product minimum remains `id`, `name`, `code`, `city`, `type`, `timezone`, `status`,
`createdAt` and `updatedAt`.

Invariants:

- `id` never changes and is the only foreign-key target.
- `name`, `code` and `city` are trimmed; empty values are rejected.
- `code` is unique across all campus rows, case-insensitively after normalization. Reuse is
     disallowed in MVP so historical exports and audit records remain unambiguous.
- `name` is unique among active campuses, case-insensitively. Reusing an inactive name is an
     open product decision; the conservative default is to reject it until an explicit rename or
     reuse policy exists.
- New campuses start as `active`. Reactivation is not an MVP command.
- `status = inactive` requires `deactivatedAt`, `deactivatedBy` and a non-empty reason;
     `status = active` requires all three to be null.
- Deactivation never updates or deletes dependent historical rows. New operational references
     must validate the campus as active in their owning use case and transaction.

The database enforces identifiers, enum values, non-null requirements, indexes and the active
name uniqueness constraint. Domain code enforces normalization, lifecycle transitions and
cross-field rules. A partial unique index on normalized active name is preferred over relying on
application checks. All mutation and audit writes share one PostgreSQL transaction.

Persistence strategy: `Campus.code` is stored canonically as `trim(lower(code))`. PostgreSQL
rejects non-canonical values with a check constraint and enforces uniqueness with a regular
unique index, which keeps the rule compatible with Prisma without requiring the `citext`
extension. Input normalization remains the responsibility of the application boundary. The
active-name rule is enforced by a PostgreSQL partial unique index on `lower(btrim(name))`.
Pre-existing campuses are assigned a deterministic `legacy-<id>` code and `unknown` city during
the additive migration because those fields did not exist in the initial schema. Pre-existing
campuses are assigned `physical` and `Europe/Paris` for the type/timezone migration because their
existing city identifies them as physical locations; these are explicit compatibility assumptions,
not inferred historical facts. PostgreSQL validates timezone values against `pg_timezone_names`.

### Audit record

`AuditEvent` is a separate append-only table, not columns on `Campus` and not a mutable history
snapshot. It contains `id`, `occurredAt`, `actorId`, `action`, `entityType`, `entityId`,
`authorizedCampusIds` (nullable only for unrestricted administration), `before`, `after`,
`reason` (nullable except for deactivation), and `correlationId` (nullable when unavailable).
`before` and `after` are structured JSON snapshots of the changed campus fields.

`AuditEvent` keeps `entityType` and `entityId` generic so the append-only stream can audit
entities beyond Campus; historical domain tables retain their own restrictive foreign keys.
`authorizedCampusIds` is nullable: `null` represents unrestricted
administration, while a non-null JSON array represents the authorization scope used. Audit rows
are append-only by application contract; update/delete repository ports are not exposed.

The application is the only writer. No update or delete repository port is exposed for audit
events; database privileges should additionally deny update/delete to the application role when
operationally practical. Audit retention and archival are separate from campus lifecycle.

### Deactivation dependency protocol

`PrismaCampusTransaction` creates the application dependency checker with the exact
`Prisma.TransactionClient` callback provided by PostgreSQL transaction scope. Before reading
dependency rows, the checker executes `SELECT ... FROM "Campus" ... FOR UPDATE` for the target
campus. It then evaluates `Cohort` rows for `startsAt <= now` and `endsAt IS NULL OR endsAt > now`,
and `Enrollment` rows joined to those cohorts for `status = active` with the same active window.
The result is `clear` or `blocked` with exactly the categories `active_cohorts` and/or
`active_enrollments`. Exam sessions and staff assignments are outside the current checker model;
they remain historical references and do not block this operation until their owning domains
define a transactional dependency policy. Any database or query failure becomes `unavailable`
and the application fails closed without returning the infrastructure error. The campus mutation
and audit write use the same transaction and lock.
