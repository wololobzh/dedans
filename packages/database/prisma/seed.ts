import { createPrismaClient } from '../src/client';

const prisma = createPrismaClient();

async function main() {
  // Clear existing data (safe in development)
  await prisma.enrollmentStatusHistory.deleteMany();
  await prisma.enrollmentProgram.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.learner.deleteMany();
  await prisma.programVersion.deleteMany();
  await prisma.program.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.campus.deleteMany();

  console.log('Seeding database with test data...');

  // Create campus
  const campus = await prisma.campus.create({
    data: {
      name: 'Rennes',
      code: 'RENNES',
      type: 'physical',
      timezone: 'Europe/Paris',
    },
  });

  console.log(`Created campus: ${campus.name}`);

  // Create programs
  const foundations = await prisma.program.create({
    data: {
      name: 'Foundations',
      code: 'FOUNDATIONS',
      category: 'foundation',
      active: true,
    },
  });

  const agenticAI = await prisma.program.create({
    data: {
      name: 'Agentic AI',
      code: 'AGENTIC_AI',
      category: 'specialization',
      active: true,
    },
  });

  const cyber = await prisma.program.create({
    data: {
      name: 'Cyber',
      code: 'CYBER',
      category: 'specialization',
      active: true,
    },
  });

  const ml = await prisma.program.create({
    data: {
      name: 'Machine Learning',
      code: 'MACHINE_LEARNING',
      category: 'specialization',
      active: true,
    },
  });

  console.log(`Created 4 programs`);

  // Create program versions
  const foundationsV1 = await prisma.programVersion.create({
    data: {
      programId: foundations.id,
      version: '2026.1',
      startValidity: new Date('2026-01-01'),
      durationMonths: 3,
      active: true,
    },
  });

  const agenticAIV1 = await prisma.programVersion.create({
    data: {
      programId: agenticAI.id,
      version: '2026.1',
      startValidity: new Date('2026-04-01'),
      durationMonths: 3,
      active: true,
    },
  });

  const cyberV1 = await prisma.programVersion.create({
    data: {
      programId: cyber.id,
      version: '2026.1',
      startValidity: new Date('2026-04-01'),
      durationMonths: 3,
      active: true,
    },
  });

  const mlV1 = await prisma.programVersion.create({
    data: {
      programId: ml.id,
      version: '2026.1',
      startValidity: new Date('2026-04-01'),
      durationMonths: 3,
      active: true,
    },
  });

  console.log(`Created 4 program versions`);

  // Create cohort
  const cohort = await prisma.cohort.create({
    data: {
      code: 'C30',
      name: 'C30 - Cohort 30',
      campusId: campus.id,
      startDate: new Date('2026-01-01'),
      expectedEndDate: new Date('2026-12-31'),
      status: 'active',
    },
  });

  console.log(`Created cohort: ${cohort.code}`);

  // Create learners
  const raider = await prisma.learner.create({
    data: {
      firstName: 'Raider',
      lastName: 'Smith',
      email: 'raider.smith@school.fr',
      phone: '+33612345678',
      birthDate: new Date('2005-03-15'),
    },
  });

  const sarah = await prisma.learner.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@school.fr',
      phone: '+33687654321',
      birthDate: new Date('2004-07-22'),
    },
  });

  const julie = await prisma.learner.create({
    data: {
      firstName: 'Julie',
      lastName: 'Martin',
      email: 'julie.martin@school.fr',
      birthDate: new Date('2005-11-08'),
    },
  });

  console.log(`Created 3 learners`);

  // Enroll Raider in C30
  const raiderEnrollment = await prisma.enrollment.create({
    data: {
      learnerId: raider.id,
      cohortId: cohort.id,
      status: 'active',
      entryType: 'standard',
      fundingType: 'personal',
      startDate: new Date('2026-01-01'),
      expectedEndDate: new Date('2026-12-31'),
    },
  });

  // Add Raider's program path: Foundations -> Agentic AI
  await prisma.enrollmentProgram.create({
    data: {
      enrollmentId: raiderEnrollment.id,
      programVersionId: foundationsV1.id,
      sequence: 1,
      status: 'completed',
      startDate: new Date('2026-01-01'),
      actualEndDate: new Date('2026-03-31'),
    },
  });

  await prisma.enrollmentProgram.create({
    data: {
      enrollmentId: raiderEnrollment.id,
      programVersionId: agenticAIV1.id,
      sequence: 2,
      status: 'active',
      startDate: new Date('2026-04-01'),
      expectedEndDate: new Date('2026-06-30'),
    },
  });

  // Create enrollment status history for Raider
  await prisma.enrollmentStatusHistory.create({
    data: {
      enrollmentId: raiderEnrollment.id,
      status: 'active',
      reason: 'Initial enrollment in C30',
      effectiveAt: new Date('2026-01-01'),
    },
  });

  console.log(`Created enrollment for Raider with Foundations + Agentic AI path`);

  // Enroll Sarah in C30
  const sarahEnrollment = await prisma.enrollment.create({
    data: {
      learnerId: sarah.id,
      cohortId: cohort.id,
      status: 'active',
      entryType: 'standard',
      fundingType: 'apprenticeship',
      startDate: new Date('2026-01-01'),
      expectedEndDate: new Date('2026-12-31'),
    },
  });

  // Add Sarah's program path: Foundations -> Cyber
  await prisma.enrollmentProgram.create({
    data: {
      enrollmentId: sarahEnrollment.id,
      programVersionId: foundationsV1.id,
      sequence: 1,
      status: 'completed',
      startDate: new Date('2026-01-01'),
      actualEndDate: new Date('2026-03-31'),
    },
  });

  await prisma.enrollmentProgram.create({
    data: {
      enrollmentId: sarahEnrollment.id,
      programVersionId: cyberV1.id,
      sequence: 2,
      status: 'active',
      startDate: new Date('2026-04-01'),
      expectedEndDate: new Date('2026-06-30'),
    },
  });

  // Create enrollment status history for Sarah
  await prisma.enrollmentStatusHistory.create({
    data: {
      enrollmentId: sarahEnrollment.id,
      status: 'active',
      reason: 'Initial enrollment in C30',
      effectiveAt: new Date('2026-01-01'),
    },
  });

  console.log(`Created enrollment for Sarah with Foundations + Cyber path`);

  // Enroll Julie in C30
  const julieEnrollment = await prisma.enrollment.create({
    data: {
      learnerId: julie.id,
      cohortId: cohort.id,
      status: 'active',
      entryType: 'standard',
      fundingType: 'company',
      startDate: new Date('2026-01-01'),
      expectedEndDate: new Date('2026-12-31'),
    },
  });

  // Add Julie's program path: Foundations -> Machine Learning
  await prisma.enrollmentProgram.create({
    data: {
      enrollmentId: julieEnrollment.id,
      programVersionId: foundationsV1.id,
      sequence: 1,
      status: 'completed',
      startDate: new Date('2026-01-01'),
      actualEndDate: new Date('2026-03-31'),
    },
  });

  await prisma.enrollmentProgram.create({
    data: {
      enrollmentId: julieEnrollment.id,
      programVersionId: mlV1.id,
      sequence: 2,
      status: 'active',
      startDate: new Date('2026-04-01'),
      expectedEndDate: new Date('2026-06-30'),
    },
  });

  // Create enrollment status history for Julie
  await prisma.enrollmentStatusHistory.create({
    data: {
      enrollmentId: julieEnrollment.id,
      status: 'active',
      reason: 'Initial enrollment in C30',
      effectiveAt: new Date('2026-01-01'),
    },
  });

  console.log(`Created enrollment for Julie with Foundations + Machine Learning path`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
