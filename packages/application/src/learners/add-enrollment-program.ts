import { EnrollmentProgram } from '@school-erp/domain';
import { EnrollmentProgramRepository, EnrollmentRepository } from './contracts';

export type AddEnrollmentProgramInput = {
  enrollmentId: string;
  programVersionId: string;
  startDate: Date;
  expectedEndDate?: Date;
};

export type AddEnrollmentProgramOutput = EnrollmentProgram;

export class AddEnrollmentProgramUseCase {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private enrollmentProgramRepository: EnrollmentProgramRepository,
  ) {}

  async execute(
    input: AddEnrollmentProgramInput,
  ): Promise<AddEnrollmentProgramOutput> {
    // Verify enrollment exists
    const enrollment = await this.enrollmentRepository.findById(input.enrollmentId);
    if (!enrollment) {
      throw new Error(`Enrollment with id ${input.enrollmentId} not found`);
    }

    // Get existing programs to determine next sequence
    const existingPrograms = await this.enrollmentProgramRepository.findByEnrollmentId(
      input.enrollmentId,
    );

    const nextSequence = existingPrograms.length + 1;

    // Create the enrollment program
    const enrollmentProgram = await this.enrollmentProgramRepository.create({
      enrollmentId: input.enrollmentId,
      programVersionId: input.programVersionId,
      sequence: nextSequence,
      status: 'planned',
      startDate: input.startDate,
      expectedEndDate: input.expectedEndDate,
    });

    return enrollmentProgram;
  }
}
