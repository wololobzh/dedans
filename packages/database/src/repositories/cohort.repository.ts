import { PrismaClient } from '@prisma/client';
import { Cohort } from '@school-erp/domain';
import { CohortRepository } from '@school-erp/application';

export class PrismaCohortRepository implements CohortRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Cohort | null> {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
    });
    return cohort as Cohort | null;
  }

  async findByCode(code: string): Promise<Cohort | null> {
    const cohort = await this.prisma.cohort.findUnique({
      where: { code },
    });
    return cohort as Cohort | null;
  }

  async findByCampusId(campusId: string): Promise<Cohort[]> {
    const cohorts = await this.prisma.cohort.findMany({
      where: { campusId },
      orderBy: { startDate: 'desc' },
    });
    return cohorts as Cohort[];
  }

  async findAll(): Promise<Cohort[]> {
    const cohorts = await this.prisma.cohort.findMany({
      orderBy: { startDate: 'desc' },
    });
    return cohorts as Cohort[];
  }

  async create(cohort: Omit<Cohort, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cohort> {
    const created = await this.prisma.cohort.create({
      data: cohort as any,
    });
    return created as Cohort;
  }

  async update(id: string, cohort: Partial<Cohort>): Promise<Cohort> {
    const updated = await this.prisma.cohort.update({
      where: { id },
      data: cohort,
    });
    return updated as Cohort;
  }
}
