export type EnrollmentStatus =
  | 'planned'
  | 'active'
  | 'paused'
  | 'completed'
  | 'withdrawn'
  | 'cancelled';

export type Enrollment = {
  id: string;
  learnerId: string;
  cohortId: string;
  status: EnrollmentStatus;
  startsAt: Date;
  endsAt?: Date;
};

export function isEnrollmentActiveAt(enrollment: Enrollment, at: Date): boolean {
  if (enrollment.status !== 'active') return false;
  if (enrollment.startsAt > at) return false;
  if (enrollment.endsAt && enrollment.endsAt < at) return false;
  return true;
}
