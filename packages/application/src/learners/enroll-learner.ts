import { Enrollment, EntryType, FundingType, EnrollmentStatus } from '@school-erp/domain';
import { EnrollmentRepository, EnrollmentStatusHistoryRepository } from './contracts';

export type EnrollLearnerInput = {
  learnerId: string;
  cohortId: string;
  status: EnrollmentStatus;
  entryType: EntryType;
  fundingType: FundingType;
  startDate: Date;
  expectedEndDate?: Date;
  actorId?: string;
};

export type EnrollLearnerOutput = Enrollment;

export class EnrollLearnerUseCase {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private statusHistoryRepository: EnrollmentStatusHistoryRepository,
  ) {}

  async execute(input: EnrollLearnerInput): Promise<EnrollLearnerOutput> {
    // Create the enrollment
    const enrollment = await this.enrollmentRepository.create({
      learnerId: input.learnerId,
      cohortId: input.cohortId,
      status: input.status,
      entryType: input.entryType,
      fundingType: input.fundingType,
      startDate: input.startDate,
      expectedEndDate: input.expectedEndDate,
    });

    // Create initial status history entry
    await this.statusHistoryRepository.create({
      enrollmentId: enrollment.id,
      status: input.status,
      reason: 'Initial enrollment',
      effectiveAt: new Date(),
      createdBy: input.actorId,
    });

    return enrollment;
  }
}
