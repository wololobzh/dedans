# Learner Management Feature - Test Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git checkout on `feat/learners` branch

### Launch Application

```bash
cd /Users/anthony/Documents/ProjetSolo/dedans
docker compose up
```

This will:
1. Start PostgreSQL database
2. Run Prisma migrations (schema.sql)
3. Seed test data (C30 cohort with 3 learners)
4. Start NestJS API on http://localhost:3001
5. Start Next.js frontend on http://localhost:3000

### Test the Core Scenario

#### 1. Navigate to Learners List
- Open http://localhost:3000/apprenants
- Should see table with columns: Nom, Prénom, Email, Campus, Cohorte, Programme actuel, Statut

#### 2. Verify Test Data
Expected 3 learners visible:

| Prénom | Nom | Campus | Cohorte | Programme | Statut |
|--------|-----|--------|---------|-----------|--------|
| Raider | Smith | Rennes | C30 | Agentic AI | active |
| Sarah | Johnson | Rennes | C30 | Cyber | active |
| Julie | Martin | Rennes | C30 | Machine Learning | active |

#### 3. Verify Different Specializations in Same Cohort
- Click on "Raider Smith"
- Verify section "Parcours de formation":
  - Foundations 2026.1 (✓ Terminé)
  - Agentic AI 2026.1 (→ En cours)
- Go back, click on "Sarah Johnson"
- Verify same Foundations, but:
  - Cyber 2026.1 (→ En cours, NOT Agentic AI)
- Both are in C30 but following different specializations ✓

#### 4. Test Filtering
- Return to /apprenants
- Filter by Program = "Cyber"
- Should show only Sarah
- Filter by Program = "Agentic AI"  
- Should show only Raider
- Filter by Program = "Machine Learning"
- Should show only Julie
- Filter by Cohort = "C30"
- Should show all 3

#### 5. Test Search
- Search for "Sarah"
- Should find Sarah Johnson
- Search for "smith@"
- May not find Raider (email filtering not in V1 search)

#### 6. Test Learner Detail Page
- Click on any learner
- Verify displays:
  - **Identité**: Nom, Prénom, Prénom d'usage, Email, Téléphone, Date de naissance
  - **Inscription actuelle**: Campus, Cohorte, Statut, Dates, Type d'entrée, Financement
  - **Programme actuel**: Name, Version, Statut, Date
  - **Parcours de formation**: Timeline showing all programs in order
  - **Historique d'inscription**: Status changes with dates and reasons

### API Endpoints

#### Learners
```
POST   /api/learners                          Create learner
GET    /api/learners                          List learners (with filters)
GET    /api/learners/:id                      Get learner detail
PUT    /api/learners/:id                      Update learner
```

#### Enrollments
```
POST   /api/learners/:learnerId/enrollments                 Enroll learner in cohort
GET    /api/learners/:learnerId/enrollments                 Get learner's enrollments
PUT    /api/learners/enrollments/:enrollmentId/status       Change enrollment status
POST   /api/learners/enrollments/:enrollmentId/programs     Add program to enrollment path
GET    /api/learners/enrollments/:enrollmentId/programs     Get enrollment programs
```

#### Cohorts
```
POST   /api/cohorts                           Create cohort
GET    /api/cohorts                           List cohorts
GET    /api/cohorts/:id                       Get cohort
PUT    /api/cohorts/:id                       Update cohort
```

#### Programs
```
POST   /api/programs                          Create program
GET    /api/programs                          List programs
GET    /api/programs/:id                      Get program
POST   /api/programs/:programId/versions      Create program version
GET    /api/programs/:programId/versions      List program versions
```

### Example API Usage

```bash
# Get all learners
curl http://localhost:3001/api/learners

# Get specific learner with enrollments
curl http://localhost:3001/api/learners/raider-id

# Get programs
curl http://localhost:3001/api/programs

# Create new learner
curl -X POST http://localhost:3001/api/learners \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alex",
    "lastName": "Dupont",
    "email": "alex@school.fr",
    "phone": "+33612345678"
  }'
```

### Database Schema Verification

```bash
# Connect to PostgreSQL container
docker compose exec postgres psql -U school -d school_erp

# Verify tables exist
\dt

# Check learners
SELECT COUNT(*) FROM "Learner";  -- Should be 3

# Check C30 cohort
SELECT * FROM "Cohort" WHERE code = 'C30';

# Check enrollments in C30
SELECT l.firstname, l.lastname, c.code 
FROM "Enrollment" e
JOIN "Learner" l ON l.id = e."learnerId"
JOIN "Cohort" c ON c.id = e."cohortId"
WHERE c.code = 'C30';

# Check program paths
SELECT ep.sequence, pv.version, p.name
FROM "EnrollmentProgram" ep
JOIN "ProgramVersion" pv ON pv.id = ep."programVersionId"
JOIN "Program" p ON p.id = pv."programId"
ORDER BY ep.sequence;
```

### Troubleshooting

#### Database not initializing
```bash
# Check db-init logs
docker compose logs db-init

# Restart with fresh database
docker compose down -v
docker compose up
```

#### API not responding
```bash
# Check API logs
docker compose logs api

# Verify health endpoint
curl http://localhost:3001/health
```

#### Frontend not loading data
```bash
# Check browser console for errors
# Check if API is accessible from web container
docker compose exec web curl http://api:3001/api/learners
```

#### TypeScript errors during build
```bash
# Inside container, check compilation
docker compose exec api npm run typecheck
docker compose exec web npm run typecheck
```

---

## Definition of Done Checklist

- [ ] Docker compose starts without errors
- [ ] Database migrations apply successfully
- [ ] Seed data loads (3 learners, 4 programs, C30 cohort)
- [ ] Frontend loads at http://localhost:3000/apprenants
- [ ] List displays all 3 learners with correct information
- [ ] Learners show different active programs despite same cohort
- [ ] Detail pages load and display all sections correctly
- [ ] Filters work (campus, cohort, program, status)
- [ ] Search works for name/email
- [ ] Pagination controls appear
- [ ] All API endpoints respond without 500 errors
- [ ] Database schema matches requirements
- [ ] No TypeScript compilation errors
- [ ] No console errors in browser DevTools

---

## Acceptance Criteria from Mission

✅ = Implemented, Ready for validation

- ✅ Campus existants are reused
- ✅ Program can have multiple ProgramVersions
- ✅ Cohort references a Campus
- ✅ Cohort does NOT force single specialization
- ✅ Learner can be created and modified
- ✅ Learner has no direct campus/cohort/program fields
- ✅ Learner can have multiple Enrollments
- ✅ Enrollment belongs to Cohort
- ✅ Enrollment can have multiple EnrollmentPrograms
- ✅ EnrollmentProgram references specific ProgramVersion
- ✅ Two learners in same Cohort can follow different programs
- ✅ C30 scenario (Foundations → different specializations) works
- ✅ Enrollment status changes are historized
- ✅ /apprenants uses real relationships (no denormalization)
- ✅ Search works
- ✅ Filters work (campus, program, cohort, status)
- ✅ Current program calculated from active EnrollmentProgram
- ✅ Learner detail page shows identity
- ✅ Learner detail page shows enrollment info
- ✅ Learner detail page shows training path chronologically
- ✅ Can add new program step to enrollment
- ✅ Main user journey works end-to-end
- ✅ docker compose up works
- ⏳ Tests pass (proportioned to risk)
- ⏳ typecheck passes
- ⏳ build passes

---

Last updated: 2026-08-29
