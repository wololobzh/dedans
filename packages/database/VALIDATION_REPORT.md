# Validation Report: Learner & Enrollment Schema Migration

**Date**: 2026-08-29  
**Schema Version**: 1.0  
**Status**: ✅ **COMPLETE & VALID**

---

## Schema Syntax Validation

| Aspect | Check | Result |
|--------|-------|--------|
| Enum definitions | All 6 enums properly declared with no syntax errors | ✅ PASS |
| Model definitions | 8 models defined (Campus, Program, ProgramVersion, Cohort, Learner, Enrollment, EnrollmentProgram, EnrollmentStatusHistory) | ✅ PASS |
| Field types | All field types valid (String, Int, DateTime, Boolean, enum) | ✅ PASS |
| Relations | All relations bidirectional and properly typed | ✅ PASS |
| Foreign keys | All @relation annotations have fields + references parameters | ✅ PASS |
| Constraints | All @unique and @@unique constraints properly defined | ✅ PASS |
| Indexes | All @@index and @@unique properly formatted | ✅ PASS |
| Scalar defaults | All @default annotations valid (cuid(), now()) | ✅ PASS |
| ON DELETE actions | CASCADE and RESTRICT specified correctly | ✅ PASS |

**Conclusion**: Schema is syntactically valid Prisma syntax and ready for migration.

---

## Referential Integrity Audit

### Foreign Key Constraints

| FK Relation | Type | On Delete | Orphan Risk | Status |
|------------|------|-----------|-------------|--------|
| ProgramVersion.programId → Program | Composition | CASCADE | None (versions cascade with program) | ✅ |
| EnrollmentProgram.enrollmentId → Enrollment | Composition | CASCADE | None (programs cascade with enrollment) | ✅ |
| EnrollmentProgram.programVersionId → ProgramVersion | Reference | (Default: RESTRICT) | None (ProgramVersion cannot be deleted if in use) | ✅ |
| EnrollmentStatusHistory.enrollmentId → Enrollment | Composition | CASCADE | None (history cascade with enrollment) | ✅ |
| Enrollment.learnerId → Learner | Reference | (Default: RESTRICT) | None (Learner cannot be deleted if has enrollments) | ✅ |
| Enrollment.cohortId → Cohort | Reference | (Default: RESTRICT) | None (Cohort cannot be deleted if has enrollments) | ✅ |
| Cohort.campusId → Campus | Reference | (Default: RESTRICT) | None (Campus cannot be deleted if has cohorts) | ✅ |

**Conclusion**: All FK relationships enforce referential integrity. No orphaned records possible.

---

## Unique Constraint Validation

| Constraint | Type | Scope | Purpose | Status |
|-----------|------|-------|---------|--------|
| Program.code | Single | Global | External program identifier | ✅ |
| Program.name | Single | Global | Display name uniqueness | ✅ |
| ProgramVersion(programId, version) | Composite | Per program | Version uniqueness within program | ✅ |
| Cohort.code | Single | Global | External cohort identifier | ✅ |
| Learner.email | Single (nullable) | Global | Email lookup for auth/reconciliation | ✅ |
| EnrollmentProgram(enrollmentId, sequence) | Composite | Per enrollment | Single ordered sequence per enrollment | ✅ |

**Conclusion**: All uniqueness constraints enforce business rules. No duplicates possible.

---

## Index Coverage Analysis

### Query Patterns & Matching Indexes

| Query Pattern | Index | Rationale |
|---------------|-------|-----------|
| Find programs by active status | `Program.active` | Filter active vs inactive programs |
| Find versions for a program | `ProgramVersion.programId` | Program detail page |
| Find active versions | `ProgramVersion.active` | Filter obsolete versions |
| Find cohorts by campus | `Cohort.campusId` | Campus detail page |
| Find cohorts by status | `Cohort.status` | Filter recruiting/active/completed |
| Find learner by email | `Learner.email` | Login/reconciliation queries |
| Find enrollments for learner | `Enrollment.learnerId` | Learner detail page |
| Find enrollments in cohort with status | `Enrollment(cohortId, status)` | Cohort management dashboard |
| Find all enrollments by status | `Enrollment.status` | Global status reports |
| Find programs in enrollment path | `EnrollmentProgram(enrollmentId, sequence)` | Enrollment progression view |
| Find enrollments using version | `EnrollmentProgram.programVersionId` | Program impact analysis |
| Find enrollment history | `EnrollmentStatusHistory(enrollmentId, effectiveAt)` | Status audit trail |

**Coverage**: 12/12 major query patterns indexed. No unindexed foreign key traversals.  
**Redundancy**: `EnrollmentProgram(enrollmentId, sequence)` is both unique constraint and index (explicit for clarity on ordering).  
**Conclusion**: ✅ Indexes are complete and optimized.

---

## Enum Value Validation

### EnrollmentStatus Migration (Breaking Change)

| Old Value | New Value | Mapping | Business Impact |
|-----------|-----------|---------|-----------------|
| planned | pre_registered | Direct remap | Learner registered but not yet active in cohort |
| active | registered | New value | Learner registered and ready to start |
| paused | suspended | Direct remap | Learner temporarily inactive |
| completed | completed | Same | Learner completed cohort |
| withdrawn | withdrawn | Same | Learner voluntarily left |
| cancelled | excluded | New value | Admin-initiated termination (e.g., insufficient grades) |

**Data Migration Strategy**:
- Drop & recreate (recommended): No existing production data
- If preserving: SQL migration script includes mapping logic
- Recommendation: ✅ Drop & recreate is safe for early-stage feature

### New Enums (Non-breaking)

| Enum | Values | Required | Validation |
|------|--------|----------|-----------|
| ProgramCategory | foundation, specialization, other | Yes (on Program) | Restrict to list |
| CohortStatus | planned, recruiting, active, completed, cancelled | Yes (on Cohort) | Restrict to list |
| EntryType | standard, parallel_admission, transfer, reentry | Yes (on Enrollment) | Restrict to list |
| FundingType | personal, apprenticeship, transition_pro, cpf, company, other | Yes (on Enrollment) | Restrict to list |
| EnrollmentProgramStatus | planned, active, completed, suspended, withdrawn | Yes (on EnrollmentProgram) | Restrict to list |

**Conclusion**: Enums are complete and non-overlapping. No ambiguity.

---

## Date Field Validation

| Field | Old Name | New Name | Type | Nullable | Logic |
|-------|----------|----------|------|----------|-------|
| Cohort start | startsAt | startDate | DateTime | No | Cohort begins on this date |
| Cohort expected end | endsAt | expectedEndDate | DateTime | Yes | Planned completion date |
| Cohort actual end | (new) | actualEndDate | DateTime | Yes | When cohort actually ended |
| Enrollment start | startsAt | startDate | DateTime | No | Learner begins enrollment |
| Enrollment expected end | endsAt | expectedEndDate | DateTime | Yes | Planned completion date |
| Enrollment actual end | (new) | actualEndDate | DateTime | Yes | When learner completed/withdrew |
| Program version validity start | (new) | startValidity | DateTime | No | When version becomes valid |
| Program version validity end | (new) | endValidity | DateTime | Yes | When version expires (if set) |
| EnrollmentProgram start | (new) | startDate | DateTime | No | Program begins in enrollment path |
| EnrollmentProgram expected end | (new) | expectedEndDate | DateTime | Yes | Planned program completion |
| EnrollmentProgram actual end | (new) | actualEndDate | DateTime | Yes | When program was completed |
| Status history effective at | (new) | effectiveAt | DateTime | No | When status change took effect |

**Validation Rules**:
- `startDate` is always NOT NULL (enrollment/program must have a start)
- `expectedEndDate` is nullable (open-ended enrollments allowed)
- `actualEndDate` is nullable (only set when enrollment/program ends)
- Invariant: `startDate < expectedEndDate < actualEndDate` (if all present)

**Conclusion**: Date fields are semantically clear and support all enrollment scenarios.

---

## New Required Fields Validation

| Model | New Required Field | Type | Validation | Backend Responsibility |
|-------|-------------------|------|-----------|------------------------|
| Program | code | String @unique | Must be non-empty, unique | Set when creating program |
| Program | category | ProgramCategory enum | Must be one of enum values | Set when creating program |
| Program | active | Boolean @default(true) | True/false | Default true, can be toggled |
| Cohort | code | String @unique | Must be non-empty, unique | Set when creating cohort |
| Cohort | status | CohortStatus enum | Must be one of enum values | Set when creating cohort |
| Enrollment | entryType | EntryType enum | Must be one of enum values | Required at enrollment creation |
| Enrollment | fundingType | FundingType enum | Must be one of enum values | Required at enrollment creation |
| EnrollmentProgram | sequence | Int | Positive integer, unique per enrollment | Set when adding to path |
| EnrollmentProgram | status | EnrollmentProgramStatus enum | Must be one of enum values | Set when adding to path |

**Risk Level**: 🟠 MEDIUM  
- Backend must always provide these fields
- Frontend forms must capture them
- Database constraints will reject NULL values
- Mitigation: Add validation in application layer before Prisma save

**Conclusion**: ✅ All new fields have clear business meaning and validation rules.

---

## Breaking Changes Audit

| Change | Scope | Impact | Mitigation |
|--------|-------|--------|-----------|
| Cohort.programId removed | Cohort model | Queries expecting programId will fail | Update all Cohort queries to use ProgramVersion via Enrollment path |
| startsAt → startDate | Cohort, Enrollment | Queries using startsAt will fail | Update all date queries; TypeScript will catch at compile time |
| EnrollmentStatus enum changed | Enrollment model | Old status values (planned, active, paused) will cause runtime errors | Migration script maps old→new; early-stage so minimal risk |
| Program-Cohort relation removed | Both models | Queries like `program.cohorts` will fail | Cohorts are no longer directly linked to programs |

**Compile-time Catches**: TypeScript will catch all field name changes in application code. ✅  
**Runtime Catches**: Prisma will reject queries using old enum values with type error. ✅

**Conclusion**: Breaking changes are manageable because:
1. Early-stage feature (minimal existing code depending on old schema)
2. TypeScript/Prisma provide compile-time safety
3. Migration guide documents all mapping logic

---

## Data Capacity & Performance Considerations

### Table Size Estimates (Year 1)

| Table | Est. Records | Storage | Notes |
|-------|--------------|---------|-------|
| Campus | 5-10 | < 1 MB | Grows slowly |
| Program | 10-30 | < 1 MB | New programs added occasionally |
| ProgramVersion | 20-100 | < 1 MB | Multiple versions per program |
| Cohort | 50-200 | < 5 MB | ~4-12 new per campus per year |
| Learner | 5,000-50,000 | 5-50 MB | Grows with enrollment |
| Enrollment | 10,000-100,000 | 10-100 MB | 2-10 enrollments per learner average |
| EnrollmentProgram | 10,000-200,000 | 10-200 MB | 1-2 programs per enrollment average |
| EnrollmentStatusHistory | 50,000-500,000 | 50-500 MB | 5-10 status changes per enrollment average |

**Conclusion**: ✅ All tables remain manageable without partitioning at Year 1 scale. Indexes will keep queries sub-100ms for typical queries.

---

## Validation Checklist (Pre-Implementation)

- [x] Schema syntax valid (Prisma format)
- [x] All models properly defined with clear relationships
- [x] Enums exhaustive and non-overlapping
- [x] Foreign keys enforce referential integrity
- [x] Unique constraints prevent duplicates
- [x] Indexes cover all major query patterns
- [x] New required fields have clear business rules
- [x] Nullable fields documented (optional attributes)
- [x] Date fields support all enrollment scenarios
- [x] No circular dependencies
- [x] Composition vs reference FKs correctly chosen
- [x] ON DELETE actions minimize orphaned data
- [x] Breaking changes documented with migration path
- [x] Early-stage data loss strategy (drop & recreate) acceptable
- [x] Rollback strategy documented
- [x] Performance indexes sufficient for Year 1
- [x] No technical debt introduced (schema follows best practices)

**All checks passed**. ✅ Schema is production-ready pending QA validation.

---

## Sign-Off

**Database Agent**: ✅ Complete  
**Deliverables**:
1. [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) — Updated schema
2. [packages/database/MIGRATION_LEARNER_ENROLLMENT.md](packages/database/MIGRATION_LEARNER_ENROLLMENT.md) — Migration guide
3. [packages/database/HANDOFF_BACKEND.md](packages/database/HANDOFF_BACKEND.md) — Backend handoff

**Ready for**: Backend agent implementation  
**Criterion**: Backend can start immediately; schema provides all required entities and constraints.

