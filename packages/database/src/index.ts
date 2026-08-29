// Persistence adapters are exported from here.
// UI code must never import Prisma or this infrastructure package directly.
export * from './client';
export * from './repositories/program.repository';
export * from './repositories/cohort.repository';
export * from './repositories/learner.repository';
