# Database Agent Handoff: Learner & Enrollment Module

**Status**: ✅ Schema design complete  
**Date**: 2026-08-29  
**Target**: Backend + Frontend implementation  

---

## What's Delivered

### 1. Updated Prisma Schema
**File**: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)

- ✅ 6 new/modified enums
- ✅ 3 new models: ProgramVersion, EnrollmentProgram, EnrollmentStatusHistory
- ✅ 5 modified models: Program, Cohort, Learner, Enrollment, (removed Program-Cohort relation)
- ✅ 12 optimized indexes covering all query patterns
- ✅ Referential integrity enforced (FK constraints with CASCADE/RESTRICT)
- ✅ Unique constraints on: Program.code, Cohort.code, ProgramVersion(programId, version), EnrollmentProgram(enrollmentId, sequence)

### 2. Migration Documentation
**File**: [packages/database/MIGRATION_LEARNER_ENROLLMENT.md](packages/database/MIGRATION_LEARNER_ENROLLMENT.md)

Comprehensive guide covering:
- Schema changes summary (added/modified/removed)
- Migration strategy (recommended: drop & recreate)
- Referential integrity matrix
- Complete index list with performance rationale
- Data migration approach (preserve & rollback scripts included)
- Validation checklist (schema, constraints, indexes, data, enums, migration, application impact, database health)
- Rollback strategy (automatic via Prisma, manual SQL documented)

---

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **ProgramVersion model** | Allows tracking program variations, validity periods, and multiple versions in use simultaneously (e.g., v2026.1 vs v2025.2) |
| **EnrollmentProgram junction** | Enables learners to enroll in sequences of programs (pathway); sequence field orders them; status tracks progress |
| **EnrollmentStatusHistory model** | Audit trail for enrollment lifecycle; captures reason and actor for compliance; supports time-based queries |
| **Cohort ↛ Program relation removed** | Decouples cohort scheduling from program definition; allows same program to run multiple times per campus |
| **Enrollment.entryType & fundingType** | New required fields capture how learner entered and who pays; enables analytics and reporting |
| **Nullable end dates** | `expectedEndDate` (planned) vs `actualEndDate` (completed); enables tracking both intent and reality |
| **Composite unique EnrollmentProgram(enrollmentId, sequence)** | Prevents duplicate programs in same path; ensures single ordered sequence |
| **CASCADE on composition, RESTRICT on reference** | Program versions cascade deleted only when program deleted; ProgramVersion cannot be deleted while in use |

---

## What Backend Must Implement

### Use Cases That Now Require Changes

1. **Enroll learner in cohort**
   - Must supply: `entryType`, `fundingType`, `startDate`
   - Must handle: `expectedEndDate`, `actualEndDate`
   - Status: Default to `pre_registered` or `registered` (business rule TBD)

2. **Create/update enrollment program path**
   - Use `EnrollmentProgram` with `sequence` ordering
   - Track `status` per program in path

3. **Update enrollment status**
   - Should create `EnrollmentStatusHistory` record (audit)
   - Provide `reason` and `createdBy` for compliance

4. **Manage programs**
   - Now create `ProgramVersion` records instead of using Program directly
   - Set `version`, `startValidity`, `endValidity`, `active` flag

5. **Manage cohorts**
   - Now set `status` (planned, recruiting, active, completed, cancelled)
   - Set `code` (unique identifier for cohort)
   - Dates: `startDate`, `expectedEndDate`, `actualEndDate`

### Validators Needed

- `entryType` must be one of enum values
- `fundingType` must be one of enum values
- `EnrollmentProgram.sequence` must be positive integer, unique per enrollment
- `ProgramVersion.version` must be unique per program
- `Cohort.code` must be unique across all cohorts
- Date validations: `startDate < expectedEndDate` (if both present)

### Authorization Boundaries

- Learner enrollment operations: Verify user is staff/admin for learner's campus
- Program changes: Verify user is admin or program manager
- Status history: Automatic audit trail; business logic defines who can change status

---

## What Frontend Must Consume

### New Domain Concepts

1. **ProgramVersion**: Frontend must select version when creating/editing enrollments
2. **EnrollmentProgram**: Display ordered sequence of programs in enrollment path
3. **EnrollmentStatusHistory**: Show audit trail of status changes with reasons
4. **Cohort status**: Use for filtering/display (recruiting vs active vs completed)
5. **Learner contact fields**: preferredName, phone, birthDate for profile forms

### New Enum Values

- `EnrollmentStatus`: pre_registered, registered, active, suspended, withdrawn, completed, excluded
- `EntryType`: standard, parallel_admission, transfer, reentry
- `FundingType`: personal, apprenticeship, transition_pro, cpf, company, other

### Form Changes

- Cohort creation: Add `code`, `status` fields
- Enrollment creation: Add `entryType`, `fundingType` dropdowns; handle `expectedEndDate` vs `actualEndDate`
- Learner profile: Add optional `preferredName`, `phone`, `birthDate`
- Program creation: Add `code`, `category` dropdown, `active` toggle

---

## Validation Checklist Before Backend Starts

- [ ] Prisma schema compiles: `cd packages/database && pnpm exec prisma format`
- [ ] No TypeScript errors: `pnpm run typecheck`
- [ ] Migration can be created locally: `pnpm exec prisma migrate dev --name learner_enrollment_evolution`
- [ ] Prisma client regenerates: `pnpm exec prisma generate`
- [ ] Docker health checks pass: `docker compose up` (wait for all services healthy)

---

## Dependencies for Implementation

### Backend Depends On
- ✅ Schema (Database) — delivered
- Application contracts in `packages/application` (use cases for enrollment, program management)
- Domain rules in `packages/domain` (enrollment status transitions, entry type/funding type validation)

### Frontend Depends On
- ✅ Schema (Database) — delivered
- API endpoints created by Backend
- Types generated from Prisma client

---

## Migration Execution Plan

1. **Local Development**
   ```bash
   cd packages/database
   pnpm exec prisma migrate dev --name learner_enrollment_evolution
   ```
   - Prompts to create migration file
   - Applies to local database
   - Generates Prisma client types

2. **Branch Commit**
   - Commit `prisma/migrations/` directory
   - Commit updated `prisma/schema.prisma`

3. **CI/CD (future)**
   - Runs `pnpm exec prisma migrate deploy` in ephemeral DB
   - Validates schema + data integrity

4. **Production (future)**
   - Backup database
   - Run `pnpm exec prisma migrate deploy`
   - Verify health checks
   - Monitor for anomalies

---

## Known Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Enum value changes (planned → pre_registered) | Medium | Migration guide includes mapping; early-stage so minimal impact |
| Date field renames (startsAt → startDate) | Medium | All query sites must be updated; compile-time TypeScript catch |
| Drop & recreate loses test data | Low | Early-stage feature; seed script can recreate test data |
| New required fields (entryType, fundingType) | Medium | Backend must always supply; form validation required |
| Null handling on optional fields | Low | Documented in schema; nullable fields marked with `?` |

---

## Next Handoff: Backend Agent

**Responsibilities**:
1. Create domain rules for Enrollment, Program, Cohort entities
2. Implement use cases: CreateEnrollment, UpdateEnrollmentStatus, etc.
3. Create repositories for new models
4. Add API endpoints consuming use cases
5. Add request DTOs with validation
6. Ensure `docker compose up` still works

**Criterion for Done**:
- Schema migrations applied successfully
- Application layer compiles without errors
- API endpoints callable (manual curl test)
- No orphaned data possible via API

---

## Contact & Questions

**Database constraints**: See [MIGRATION_LEARNER_ENROLLMENT.md](packages/database/MIGRATION_LEARNER_ENROLLMENT.md) section 3 & 5  
**Index rationale**: See section 4  
**Enum values**: See schema section 1  

Migration is production-ready after QA validation. ✅

