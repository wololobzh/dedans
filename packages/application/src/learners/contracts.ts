import {
  Learner,
  Enrollment,
  EnrollmentProgram,
  EnrollmentStatus,
  EntryType,
  FundingType,
  EnrollmentStatusChange,
} from '@school-erp/domain';

export interface LearnerRepository {
  findById(id: string): Promise<Learner | null>;
  findByEmail(email: string): Promise<Learner | null>;
  findAll(): Promise<Learner[]>;
  findByIds(ids: string[]): Promise<Learner[]>;
  create(learner: Omit<Learner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Learner>;
  update(id: string, learner: Partial<Learner>): Promise<Learner>;
}

export interface EnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>;
  findByLearnerId(learnerId: string): Promise<Enrollment[]>;
  findByCohortId(cohortId: string): Promise<Enrollment[]>;
  findAll(): Promise<Enrollment[]>;
  create(
    enrollment: Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Enrollment>;
  update(id: string, enrollment: Partial<Enrollment>): Promise<Enrollment>;
}

export interface EnrollmentProgramRepository {
  findById(id: string): Promise<EnrollmentProgram | null>;
  findByEnrollmentId(enrollmentId: string): Promise<EnrollmentProgram[]>;
  findByProgramVersionId(programVersionId: string): Promise<EnrollmentProgram[]>;
  create(
    program: Omit<EnrollmentProgram, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<EnrollmentProgram>;
  update(id: string, program: Partial<EnrollmentProgram>): Promise<EnrollmentProgram>;
}

export interface EnrollmentStatusHistoryRepository {
  findByEnrollmentId(enrollmentId: string): Promise<EnrollmentStatusChange[]>;
  create(
    change: Omit<EnrollmentStatusChange, 'id' | 'createdAt'>,
  ): Promise<EnrollmentStatusChange>;
}
