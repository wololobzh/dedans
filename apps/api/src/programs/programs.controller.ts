import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ProgramRepository, ProgramVersionRepository } from '@school-erp/application';
import { PrismaProgramRepository, PrismaProgramVersionRepository } from '@school-erp/database';
import { CreateProgramDto, CreateProgramVersionDto, ProgramResponseDto, ProgramVersionResponseDto } from './dto';

@Controller('api/programs')
export class ProgramsController {
  private programRepository: ProgramRepository;
  private programVersionRepository: ProgramVersionRepository;

  constructor(private prisma: PrismaClient) {
    this.programRepository = new PrismaProgramRepository(this.prisma);
    this.programVersionRepository = new PrismaProgramVersionRepository(this.prisma);
  }

  @Post()
  async createProgram(@Body() dto: CreateProgramDto): Promise<ProgramResponseDto> {
    const program = await this.programRepository.create({
      name: dto.name,
      code: dto.code,
      category: dto.category,
      active: true,
    });
    return this.mapProgramToDto(program);
  }

  @Get()
  async listPrograms(): Promise<ProgramResponseDto[]> {
    const programs = await this.programRepository.findAll();
    return programs.map((p) => this.mapProgramToDto(p));
  }

  @Get(':id')
  async getProgram(@Param('id') id: string): Promise<ProgramResponseDto> {
    const program = await this.programRepository.findById(id);
    if (!program) {
      throw new Error(`Program with id ${id} not found`);
    }
    return this.mapProgramToDto(program);
  }

  @Post(':programId/versions')
  async createProgramVersion(@Body() dto: CreateProgramVersionDto): Promise<ProgramVersionResponseDto> {
    const version = await this.programVersionRepository.create({
      programId: dto.programId,
      version: dto.version,
      startValidity: new Date(dto.startValidity),
      endValidity: dto.endValidity ? new Date(dto.endValidity) : undefined,
      durationHours: dto.durationHours,
      durationMonths: dto.durationMonths,
      active: true,
    });
    return this.mapProgramVersionToDto(version);
  }

  @Get(':programId/versions')
  async getProgramVersions(@Param('programId') programId: string): Promise<ProgramVersionResponseDto[]> {
    const versions = await this.programVersionRepository.findByProgramId(programId);
    return versions.map((v) => this.mapProgramVersionToDto(v));
  }

  private mapProgramToDto(program: any): ProgramResponseDto {
    return {
      id: program.id,
      name: program.name,
      code: program.code,
      category: program.category,
      active: program.active,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  }

  private mapProgramVersionToDto(version: any): ProgramVersionResponseDto {
    return {
      id: version.id,
      programId: version.programId,
      version: version.version,
      startValidity: version.startValidity.toISOString(),
      endValidity: version.endValidity?.toISOString(),
      durationHours: version.durationHours,
      durationMonths: version.durationMonths,
      active: version.active,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    };
  }
}
