import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CohortRepository } from '@school-erp/application';
import { PrismaCohortRepository } from '@school-erp/database';
import { CreateCohortDto, UpdateCohortDto, CohortResponseDto } from './dto';

@Controller('api/cohorts')
export class CohortsController {
  private cohortRepository: CohortRepository;

  constructor(private prisma: PrismaClient) {
    this.cohortRepository = new PrismaCohortRepository(this.prisma);
  }

  @Post()
  async createCohort(@Body() dto: CreateCohortDto): Promise<CohortResponseDto> {
    const cohort = await this.cohortRepository.create({
      code: dto.code,
      name: dto.name,
      campusId: dto.campusId,
      startDate: new Date(dto.startDate),
      expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
      status: dto.status,
    });
    return this.mapCohortToDto(cohort);
  }

  @Get()
  async listCohorts(
    @Query('campusId') campusId?: string,
    @Query('status') status?: string,
  ): Promise<CohortResponseDto[]> {
    let cohorts;
    if (campusId) {
      cohorts = await this.cohortRepository.findByCampusId(campusId);
    } else {
      cohorts = await this.cohortRepository.findAll();
    }

    if (status) {
      cohorts = cohorts.filter((c) => c.status === status);
    }

    return cohorts.map((c) => this.mapCohortToDto(c));
  }

  @Get(':id')
  async getCohort(@Param('id') id: string): Promise<CohortResponseDto> {
    const cohort = await this.cohortRepository.findById(id);
    if (!cohort) {
      throw new Error(`Cohort with id ${id} not found`);
    }
    return this.mapCohortToDto(cohort);
  }

  @Put(':id')
  async updateCohort(
    @Param('id') id: string,
    @Body() dto: UpdateCohortDto,
  ): Promise<CohortResponseDto> {
    const cohort = await this.cohortRepository.update(id, {
      name: dto.name,
      expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
      actualEndDate: dto.actualEndDate ? new Date(dto.actualEndDate) : undefined,
      status: dto.status,
    });
    return this.mapCohortToDto(cohort);
  }

  private mapCohortToDto(cohort: any): CohortResponseDto {
    return {
      id: cohort.id,
      code: cohort.code,
      name: cohort.name,
      campusId: cohort.campusId,
      startDate: cohort.startDate.toISOString(),
      expectedEndDate: cohort.expectedEndDate?.toISOString(),
      actualEndDate: cohort.actualEndDate?.toISOString(),
      status: cohort.status,
      createdAt: cohort.createdAt.toISOString(),
      updatedAt: cohort.updatedAt.toISOString(),
    };
  }
}
