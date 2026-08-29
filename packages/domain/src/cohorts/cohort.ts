export type Cohort = {
  id: string;
  code: string;
  name: string;
  campusId: string;
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  status: CohortStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CohortStatus = 'planned' | 'recruiting' | 'active' | 'completed' | 'cancelled';

export function isCohortActive(cohort: Cohort, at: Date): boolean {
  if (cohort.status !== 'active') return false;
  if (cohort.startDate > at) return false;
  if (cohort.expectedEndDate && cohort.expectedEndDate < at) return false;
  return true;
}

export function canEnrollInCohort(cohort: Cohort): boolean {
  return cohort.status === 'recruiting' || cohort.status === 'active';
}
