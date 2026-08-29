CREATE TABLE "Campus" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campus_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Campus_name_key" UNIQUE ("name")
);

CREATE TABLE "Program" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cohort" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "campusId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Cohort_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Cohort_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Cohort_campusId_idx" ON "Cohort" ("campusId");
CREATE INDEX "Cohort_programId_idx" ON "Cohort" ("programId");

CREATE TABLE "Learner" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Learner_email_key" ON "Learner" ("email");

CREATE TYPE "EnrollmentStatus" AS ENUM ('planned', 'active', 'paused', 'completed', 'withdrawn', 'cancelled');
CREATE TABLE "Enrollment" (
  "id" TEXT NOT NULL,
  "learnerId" TEXT NOT NULL,
  "cohortId" TEXT NOT NULL,
  "status" "EnrollmentStatus" NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Enrollment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Enrollment_learnerId_idx" ON "Enrollment" ("learnerId");
CREATE INDEX "Enrollment_cohortId_status_idx" ON "Enrollment" ("cohortId", "status");