-- CreateEnum for ProgramCategory
CREATE TYPE "ProgramCategory" AS ENUM ('foundation', 'specialization', 'other');

-- CreateEnum for CohortStatus
CREATE TYPE "CohortStatus" AS ENUM ('planned', 'recruiting', 'active', 'completed', 'cancelled');

-- CreateEnum for EnrollmentStatus
CREATE TYPE "EnrollmentStatus" AS ENUM ('pre_registered', 'registered', 'active', 'suspended', 'withdrawn', 'completed', 'excluded');

-- CreateEnum for EntryType
CREATE TYPE "EntryType" AS ENUM ('standard', 'parallel_admission', 'transfer', 'reentry');

-- CreateEnum for FundingType
CREATE TYPE "FundingType" AS ENUM ('personal', 'apprenticeship', 'transition_pro', 'cpf', 'company', 'other');

-- CreateEnum for EnrollmentProgramStatus
CREATE TYPE "EnrollmentProgramStatus" AS ENUM ('planned', 'active', 'completed', 'suspended', 'withdrawn');

-- CreateTable Campus
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable Program
CREATE TABLE "Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "category" "ProgramCategory" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable ProgramVersion
CREATE TABLE "ProgramVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "startValidity" TIMESTAMP(3) NOT NULL,
    "endValidity" TIMESTAMP(3),
    "durationHours" INTEGER,
    "durationMonths" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgramVersion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Cohort
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "status" "CohortStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cohort_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable Learner
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "email" TEXT UNIQUE,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable Enrollment
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "learnerId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL,
    "entryType" "EntryType" NOT NULL,
    "fundingType" "FundingType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enrollment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable EnrollmentProgram
CREATE TABLE "EnrollmentProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "programVersionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "EnrollmentProgramStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EnrollmentProgram_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EnrollmentProgram_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "ProgramVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable EnrollmentStatusHistory
CREATE TABLE "EnrollmentStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollmentId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL,
    "reason" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnrollmentStatusHistory_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex Program
CREATE INDEX "Program_active_idx" ON "Program"("active");

-- CreateIndex ProgramVersion
CREATE UNIQUE INDEX "ProgramVersion_programId_version_key" ON "ProgramVersion"("programId", "version");
CREATE INDEX "ProgramVersion_programId_idx" ON "ProgramVersion"("programId");
CREATE INDEX "ProgramVersion_active_idx" ON "ProgramVersion"("active");

-- CreateIndex Cohort
CREATE INDEX "Cohort_campusId_idx" ON "Cohort"("campusId");
CREATE INDEX "Cohort_status_idx" ON "Cohort"("status");

-- CreateIndex Learner
CREATE INDEX "Learner_email_idx" ON "Learner"("email");

-- CreateIndex Enrollment
CREATE INDEX "Enrollment_learnerId_idx" ON "Enrollment"("learnerId");
CREATE INDEX "Enrollment_cohortId_status_idx" ON "Enrollment"("cohortId", "status");
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex EnrollmentProgram
CREATE UNIQUE INDEX "EnrollmentProgram_enrollmentId_sequence_key" ON "EnrollmentProgram"("enrollmentId", "sequence");
CREATE INDEX "EnrollmentProgram_enrollmentId_sequence_idx" ON "EnrollmentProgram"("enrollmentId", "sequence");
CREATE INDEX "EnrollmentProgram_programVersionId_idx" ON "EnrollmentProgram"("programVersionId");

-- CreateIndex EnrollmentStatusHistory
CREATE INDEX "EnrollmentStatusHistory_enrollmentId_effectiveAt_idx" ON "EnrollmentStatusHistory"("enrollmentId", "effectiveAt" DESC);
