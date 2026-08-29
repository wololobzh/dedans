import { Enrollment, EnrollmentStatus } from '@school-erp/domain';
import { EnrollmentRepository, EnrollmentStatusHistoryRepository } from './contracts';

export type ChangeEnrollmentStatusInput = {
  enrollmentId: string;
  status: EnrollmentStatus;
  reason?: string;
  actorId?: string;
};

export type ChangeEnrollmentStatusOutput = Enrollment;

export class ChangeEnrollmentStatusUseCase {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private statusHistoryRepository: EnrollmentStatusHistoryRepository,
  ) {}

  async execute(
    input: ChangeEnrollmentStatusInput,
  ): Promise<ChangeEnrollmentStatusOutput> {
    const enrollment = await this.enrollmentRepository.findById(input.enrollmentId);
    if (!enrollment) {
      throw new Error(`Enrollment with id ${input.enrollmentId} not found`);
    }

    if (enrollment.status === input.status) {
      throw new Error(`Enrollment status is already ${input.status}`);
    }

    // Update the enrollment
    const updated = await this.enrollmentRepository.update(input.enrollmentId, {
      status: input.status,
    });

    // Record the status change in history
    await this.statusHistoryRepository.create({
      enrollmentId: input.enrollmentId,
      status: input.status,
      reason: input.reason,
      effectiveAt: new Date(),
      createdBy: input.actorId,
    });

    return updated;
  }
}
