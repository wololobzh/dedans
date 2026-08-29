import { Learner } from '@school-erp/domain';
import { LearnerRepository } from './contracts';

export type UpdateLearnerInput = {
  id: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
};

export type UpdateLearnerOutput = Learner;

export class UpdateLearnerUseCase {
  constructor(private learnerRepository: LearnerRepository) {}

  async execute(input: UpdateLearnerInput): Promise<UpdateLearnerOutput> {
    const learner = await this.learnerRepository.findById(input.id);
    if (!learner) {
      throw new Error(`Learner with id ${input.id} not found`);
    }

    // Validate email uniqueness if changing email
    if (input.email && input.email !== learner.email) {
      const existing = await this.learnerRepository.findByEmail(input.email);
      if (existing) {
        throw new Error(`Learner with email ${input.email} already exists`);
      }
    }

    // Update the learner
    const updated = await this.learnerRepository.update(input.id, {
      firstName: input.firstName,
      lastName: input.lastName,
      preferredName: input.preferredName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
    });

    return updated;
  }
}
