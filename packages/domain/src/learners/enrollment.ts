export type EnrollmentStatus =
  | 'pre_registered'
  | 'registered'
  | 'active'
  | 'suspended'
  | 'withdrawn'
  | 'completed'
  | 'excluded';

export type EntryType = 'standard' | 'parallel_admission' | 'transfer' | 'reentry';

export type FundingType =
  | 'personal'
  | 'apprenticeship'
  | 'transition_pro'
  | 'cpf'
  | 'company'
  | 'other';

export type Learner = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type Enrollment = {
  id: string;
  learnerId: string;
  cohortId: string;
  status: EnrollmentStatus;
  entryType: EntryType;
  fundingType: FundingType;
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type EnrollmentProgram = {
  id: string;
  enrollmentId: string;
  programVersionId: string;
  sequence: number;
  status: EnrollmentProgramStatus;
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type EnrollmentProgramStatus = 'planned' | 'active' | 'completed' | 'suspended' | 'withdrawn';

export type EnrollmentStatusChange = {
  id: string;
  enrollmentId: string;
  status: EnrollmentStatus;
  reason?: string;
  effectiveAt: Date;
  createdBy?: string;
  createdAt: Date;
};

export function isEnrollmentActive(enrollment: Enrollment, at: Date): boolean {
  if (enrollment.status !== 'active') return false;
  if (enrollment.startDate > at) return false;
  if (enrollment.expectedEndDate && enrollment.expectedEndDate < at) return false;
  return true;
}

export function isEnrollmentProgramActive(
  program: EnrollmentProgram,
  at: Date,
): boolean {
  if (program.status !== 'active') return false;
  if (program.startDate > at) return false;
  if (program.expectedEndDate && program.expectedEndDate < at) return false;
  return true;
}

export function getActiveEnrollmentProgram(
  programs: EnrollmentProgram[],
  at: Date,
): EnrollmentProgram | undefined {
  return programs.find((p) => isEnrollmentProgramActive(p, at));
}

export function getEnrollmentProgramSequence(
  programs: EnrollmentProgram[],
): EnrollmentProgram[] {
  return [...programs].sort((a, b) => a.sequence - b.sequence);
}
