import { PrismaClient } from '@prisma/client';
import {
  Learner,
  Enrollment,
  EnrollmentProgram,
  EnrollmentStatusChange,
} from '@school-erp/domain';
import {
  LearnerRepository,
  EnrollmentRepository,
  EnrollmentProgramRepository,
  EnrollmentStatusHistoryRepository,
} from '@school-erp/application';

export class PrismaLearnerRepository implements LearnerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Learner | null> {
    const learner = await this.prisma.learner.findUnique({
      where: { id },
    });
    return learner as Learner | null;
  }

  async findByEmail(email: string): Promise<Learner | null> {
    const learner = await this.prisma.learner.findUnique({
      where: { email },
    });
    return learner as Learner | null;
  }

  async findAll(): Promise<Learner[]> {
    const learners = await this.prisma.learner.findMany();
    return learners as Learner[];
  }

  async findByIds(ids: string[]): Promise<Learner[]> {
    const learners = await this.prisma.learner.findMany({
      where: { id: { in: ids } },
    });
    return learners as Learner[];
  }

  async create(learner: Omit<Learner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Learner> {
    const created = await this.prisma.learner.create({
      data: learner as any,
    });
    return created as Learner;
  }

  async update(id: string, learner: Partial<Learner>): Promise<Learner> {
    const updated = await this.prisma.learner.update({
      where: { id },
      data: learner,
    });
    return updated as Learner;
  }
}

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Enrollment | null> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });
    return enrollment as Enrollment | null;
  }

  async findByLearnerId(learnerId: string): Promise<Enrollment[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { learnerId },
      orderBy: { startDate: 'desc' },
    });
    return enrollments as Enrollment[];
  }

  async findByCohortId(cohortId: string): Promise<Enrollment[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { cohortId },
      orderBy: { startDate: 'asc' },
    });
    return enrollments as Enrollment[];
  }

  async findAll(): Promise<Enrollment[]> {
    const enrollments = await this.prisma.enrollment.findMany();
    return enrollments as Enrollment[];
  }

  async create(
    enrollment: Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Enrollment> {
    const created = await this.prisma.enrollment.create({
      data: enrollment as any,
    });
    return created as Enrollment;
  }

  async update(id: string, enrollment: Partial<Enrollment>): Promise<Enrollment> {
    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: enrollment,
    });
    return updated as Enrollment;
  }
}

export class PrismaEnrollmentProgramRepository implements EnrollmentProgramRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<EnrollmentProgram | null> {
    const program = await this.prisma.enrollmentProgram.findUnique({
      where: { id },
    });
    return program as EnrollmentProgram | null;
  }

  async findByEnrollmentId(enrollmentId: string): Promise<EnrollmentProgram[]> {
    const programs = await this.prisma.enrollmentProgram.findMany({
      where: { enrollmentId },
      orderBy: { sequence: 'asc' },
    });
    return programs as EnrollmentProgram[];
  }

  async findByProgramVersionId(programVersionId: string): Promise<EnrollmentProgram[]> {
    const programs = await this.prisma.enrollmentProgram.findMany({
      where: { programVersionId },
    });
    return programs as EnrollmentProgram[];
  }

  async create(
    program: Omit<EnrollmentProgram, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<EnrollmentProgram> {
    const created = await this.prisma.enrollmentProgram.create({
      data: program as any,
    });
    return created as EnrollmentProgram;
  }

  async update(id: string, program: Partial<EnrollmentProgram>): Promise<EnrollmentProgram> {
    const updated = await this.prisma.enrollmentProgram.update({
      where: { id },
      data: program,
    });
    return updated as EnrollmentProgram;
  }
}

export class PrismaEnrollmentStatusHistoryRepository
  implements EnrollmentStatusHistoryRepository
{
  constructor(private prisma: PrismaClient) {}

  async findByEnrollmentId(enrollmentId: string): Promise<EnrollmentStatusChange[]> {
    const history = await this.prisma.enrollmentStatusHistory.findMany({
      where: { enrollmentId },
      orderBy: { effectiveAt: 'asc' },
    });
    return history as EnrollmentStatusChange[];
  }

  async create(
    change: Omit<EnrollmentStatusChange, 'id' | 'createdAt'>,
  ): Promise<EnrollmentStatusChange> {
    const created = await this.prisma.enrollmentStatusHistory.create({
      data: change as any,
    });
    return created as EnrollmentStatusChange;
  }
}
