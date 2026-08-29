import { Cohort, CohortStatus } from '@school-erp/domain';

export interface CohortRepository {
  findById(id: string): Promise<Cohort | null>;
  findByCode(code: string): Promise<Cohort | null>;
  findByCampusId(campusId: string): Promise<Cohort[]>;
  findAll(): Promise<Cohort[]>;
  create(cohort: Omit<Cohort, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cohort>;
  update(id: string, cohort: Partial<Cohort>): Promise<Cohort>;
}
