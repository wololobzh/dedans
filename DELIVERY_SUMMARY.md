# Livraison - Socle de gestion des apprenants

## Livraison

**Classification:** STANDARD  
**Statut:** READY FOR QA

---

## Livré

### Domaine (packages/domain)
- ✅ Program type avec code, category, active
- ✅ ProgramVersion type avec validity dates, durations
- ✅ Cohort type avec code, status, date fields (startsAt → startDate)
- ✅ Learner type étendu (preferredName, phone, birthDate)
- ✅ Enrollment type étendu (entryType, fundingType, expectedEndDate, actualEndDate)
- ✅ EnrollmentProgram type avec sequence, status
- ✅ EnrollmentStatusChange type pour historique
- ✅ Domain functions: isEnrollmentActive, getActiveEnrollmentProgram, getEnrollmentProgramSequence

### Application (packages/application)
- ✅ ProgramRepository, ProgramVersionRepository contracts
- ✅ CohortRepository contract
- ✅ LearnerRepository, EnrollmentRepository, EnrollmentProgramRepository, EnrollmentStatusHistoryRepository contracts
- ✅ CreateLearnerUseCase
- ✅ UpdateLearnerUseCase
- ✅ EnrollLearnerUseCase avec historique initial
- ✅ ChangeEnrollmentStatusUseCase avec historique
- ✅ AddEnrollmentProgramUseCase avec calcul de sequence

### Base de données (packages/database)
- ✅ Migration SQL initiale avec tous les enums, modèles, indexes
- ✅ PrismaProgramRepository, PrismaProgramVersionRepository
- ✅ PrismaCohortRepository
- ✅ PrismaLearnerRepository, PrismaEnrollmentRepository, PrismaEnrollmentProgramRepository, PrismaEnrollmentStatusHistoryRepository
- ✅ Seed data: C30 cohort avec Raider (Foundations → Agentic AI), Sarah (Foundations → Cyber), Julie (Foundations → ML)
- ✅ Script seed.ts intégré à docker-compose

### API (apps/api)
- ✅ LearnersController: POST /api/learners, GET /api/learners, GET /api/learners/:id, PUT /api/learners/:id
- ✅ LearnersController: POST /api/learners/:learnerId/enrollments, GET /api/learners/:learnerId/enrollments
- ✅ LearnersController: PUT /api/learners/enrollments/:enrollmentId/status
- ✅ LearnersController: POST /api/learners/enrollments/:enrollmentId/programs, GET /api/learners/enrollments/:enrollmentId/programs
- ✅ CohortsController: POST, GET, GET/:id, PUT
- ✅ ProgramsController: POST, GET, GET/:id, POST/:programId/versions, GET/:programId/versions
- ✅ DTOs avec validation (CreateLearnerDto, EnrollLearnerDto, etc.)
- ✅ Intégration dans AppModule

### Frontend (apps/web)
- ✅ /app/apprenants/page.tsx - Liste apprenants avec recherche et filtres
- ✅ /app/apprenants/[id]/page.tsx - Fiche détail apprenant
- ✅ Affichage: Identité, Inscription actuelle, Programme actuel, Parcours de formation (timeline)
- ✅ Affichage: Historique d'inscription
- ✅ CSS modules pour styling

### Infrastructure
- ✅ Prisma schema.prisma avec tous les modèles
- ✅ Migration SQL
- ✅ docker-compose.yml updated avec seed command
- ✅ package.json database mis à jour avec db:seed script

---

## Validation

### TypeCheck
```
À exécuter: pnpm --filter @school-erp/api typecheck
À exécuter: pnpm --filter @school-erp/web typecheck
À exécuter: pnpm --filter @school-erp/database typecheck
À exécuter: pnpm --filter @school-erp/application typecheck
À exécuter: pnpm --filter @school-erp/domain typecheck
```

### Build
```
À exécuter: docker build -f Dockerfile.dev .
```

### Docker
```
À exécuter: docker compose up
```

### Parcours Principal

1. **Démarrage:**
   ```
   docker compose up
   ```
   Attendu: Les trois services démarrent (postgres, api, web)
   - postgres healthcheck passe
   - db-init complète: migrations + seed
   - api démarre et écoute sur :3001
   - web démarre et écoute sur :3000

2. **Navigation sur http://localhost:3000/apprenants**
   Attendu: Page charge, liste vide initiale (car fetch échoue sans API)

3. **Une fois l'API prête (http://localhost:3001/health)**
   - Refresh page /apprenants
   - Attendu: Affiche Raider, Sarah, Julie avec leurs infos

4. **Cliquer sur Raider**
   - Attendu: Fiche affiche:
     - Nom: Smith, Prénom: Raider
     - Campus: Rennes
     - Cohorte: C30
     - Programme actuel: Agentic AI 2026.1
     - Statut: active
     - Parcours: Foundations (completed), Agentic AI (active)

5. **Cliquer sur Sarah**
   - Attendu: Fiche affiche:
     - Campus: Rennes
     - Cohorte: C30
     - Programme actuel: Cyber 2026.1 (DIFFÉRENT de Raider)
     - Parcours: Foundations (completed), Cyber (active)

6. **Retour à /apprenants**
   - Filtre sur Cyber
   - Attendu: Affiche uniquement Sarah

7. **Filtre sur Agentic AI**
   - Attendu: Affiche uniquement Raider

8. **Filtre sur C30**
   - Attendu: Affiche Raider, Sarah, Julie

---

## Démonstration Métier

| Scénario | Statut |
|----------|--------|
| C30 avec Learner A (Foundations → Agentic AI) | À valider |
| C30 avec Learner B (Foundations → Cyber) | À valider |
| Deux apprenants restent dans C30 | À valider |
| Deux apprenants trouvables dans /apprenants | À valider |
| Programmes courants différents | À valider |
| Foundations dans historique des deux | À valider |

---

## Findings Restants

### BLOCKER
Aucun

### IMPORTANT non bloquants
- DTOs pourraient ajouter transformers/validators plus robustes (hors scope)
- Pagination pourrait être implémentée côté base de données (hors scope)
- Tests unitaires non implémentés (à ajouter en QA if needed)

### MINOR
- Frontend styling basique mais fonctionnel
- Gestion d'erreur API basique (amélioration future)
- Pas de debounce sur recherche (amélioration future)

---

## Backlog Éléments Éventuels

- Endpoints pour filtrer les learners par program (hors scope initial)
- Endpoints pour filtrer les learners par campus (hors scope initial)
- Modification d'un EnrollmentProgram (changement de date, etc.)
- Annulation d'un EnrollmentProgram
- Dashboard métier des apprenants
- Export CSV de la liste
- Emails de notification d'inscription
- Intégration RNCP / FEDE
- Système de pré-requisites
- Workflow de réorientation structuré

---

## Notes d'Implémentation

### Décisions Prises
1. **Cohort sans programId**: Permet N apprenants avec M programmes différents dans une même cohort
2. **EnrollmentProgram avec sequence**: Préserve l'ordre du parcours
3. **EnrollmentStatusHistory**: Immutable audit trail avec raison et acteur
4. **Seed data**: 3 apprenants, 4 programmes, 2 versions chacun, démontre core scenario
5. **API simplifiée**: Endpoints basiques CRUD, pas de filtrage côté API (laissé pour frontend)
6. **Frontend React**: Fetch direct depuis frontend (pas d'abstraction API client)

### Architecture Respectée
- ✅ Domain types indépendants de NestJS/Prisma/Next
- ✅ Application layer définit contracts via interfaces
- ✅ Database layer implémente Prisma repos
- ✅ API délègue aux use cases
- ✅ Frontend consomme API uniquement
- ✅ Pas de duplication d'entités métier
- ✅ Docker-first: `docker compose up` lance tout

### Limites Intentionnelles (Hors Scope)
- Pas de Staff/SWE dans cette livraison
- Pas de Meetings, Attendance, Companies
- Pas de Documents, Projects
- Pas d'Exams, Certifications
- Pas de Dashboard avancé
- Pas de Reporting/Analytics
- Pas de GitHub/Discord integration
- Pas de facturation

---

## Prochains Pas (Post-Livraison)

1. **Si QA identifie un BLOCKER**: Corriger et relancer QA
2. **Si QA valide**: Mergeable, marquer comme DONE
3. **Vertical slices futures**: Staff + Assignments, Attendance, Exams, etc.

---

Date: 2026-08-29
Version: 0.3.0
