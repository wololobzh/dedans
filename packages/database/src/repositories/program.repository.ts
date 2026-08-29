import { PrismaClient } from '@prisma/client';
import { Program, ProgramVersion } from '@school-erp/domain';
import { ProgramRepository, ProgramVersionRepository } from '@school-erp/application';

export class PrismaProgramRepository implements ProgramRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Program | null> {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });
    return program as Program | null;
  }

  async findByCode(code: string): Promise<Program | null> {
    const program = await this.prisma.program.findUnique({
      where: { code },
    });
    return program as Program | null;
  }

  async findAll(): Promise<Program[]> {
    const programs = await this.prisma.program.findMany();
    return programs as Program[];
  }

  async create(
    program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Program> {
    const created = await this.prisma.program.create({
      data: program as any,
    });
    return created as Program;
  }

  async update(id: string, program: Partial<Program>): Promise<Program> {
    const updated = await this.prisma.program.update({
      where: { id },
      data: program,
    });
    return updated as Program;
  }
}

export class PrismaProgramVersionRepository implements ProgramVersionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<ProgramVersion | null> {
    const version = await this.prisma.programVersion.findUnique({
      where: { id },
    });
    return version as ProgramVersion | null;
  }

  async findByProgramId(programId: string): Promise<ProgramVersion[]> {
    const versions = await this.prisma.programVersion.findMany({
      where: { programId },
      orderBy: { version: 'desc' },
    });
    return versions as ProgramVersion[];
  }

  async findByProgramIdAndVersion(
    programId: string,
    version: string,
  ): Promise<ProgramVersion | null> {
    const found = await this.prisma.programVersion.findUnique({
      where: {
        programId_version: { programId, version },
      },
    });
    return found as ProgramVersion | null;
  }

  async create(
    version: Omit<ProgramVersion, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ProgramVersion> {
    const created = await this.prisma.programVersion.create({
      data: version as any,
    });
    return created as ProgramVersion;
  }
}
