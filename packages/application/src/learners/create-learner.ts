import { Learner } from '@school-erp/domain';
import { LearnerRepository } from './contracts';

export type CreateLearnerInput = {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
};

export type CreateLearnerOutput = Learner;

export class CreateLearnerUseCase {
  constructor(private learnerRepository: LearnerRepository) {}

  async execute(input: CreateLearnerInput): Promise<CreateLearnerOutput> {
    // Validate email uniqueness if provided
    if (input.email) {
      const existing = await this.learnerRepository.findByEmail(input.email);
      if (existing) {
        throw new Error(`Learner with email ${input.email} already exists`);
      }
    }

    // Create the learner
    const learner = await this.learnerRepository.create({
      firstName: input.firstName,
      lastName: input.lastName,
      preferredName: input.preferredName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
    });

    return learner;
  }
}
