import { Program, ProgramVersion } from '@school-erp/domain';

export interface ProgramRepository {
  findById(id: string): Promise<Program | null>;
  findByCode(code: string): Promise<Program | null>;
  findAll(): Promise<Program[]>;
  create(program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program>;
  update(id: string, program: Partial<Program>): Promise<Program>;
}

export interface ProgramVersionRepository {
  findById(id: string): Promise<ProgramVersion | null>;
  findByProgramId(programId: string): Promise<ProgramVersion[]>;
  findByProgramIdAndVersion(
    programId: string,
    version: string,
  ): Promise<ProgramVersion | null>;
  create(
    version: Omit<ProgramVersion, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ProgramVersion>;
}
