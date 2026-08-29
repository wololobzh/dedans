import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateLearnerUseCase,
  UpdateLearnerUseCase,
  EnrollLearnerUseCase,
  ChangeEnrollmentStatusUseCase,
  AddEnrollmentProgramUseCase,
  LearnerRepository,
  EnrollmentRepository,
  EnrollmentProgramRepository,
  EnrollmentStatusHistoryRepository,
} from '@school-erp/application';
import {
  PrismaLearnerRepository,
  PrismaEnrollmentRepository,
  PrismaEnrollmentProgramRepository,
  PrismaEnrollmentStatusHistoryRepository,
} from '@school-erp/database';
import {
  CreateLearnerDto,
  UpdateLearnerDto,
  LearnerResponseDto,
  EnrollLearnerDto,
  EnrollmentResponseDto,
  ChangeEnrollmentStatusDto,
  AddEnrollmentProgramDto,
  EnrollmentProgramResponseDto,
} from './dto';

@Controller('api/learners')
export class LearnersController {
  private learnerRepository: LearnerRepository;
  private enrollmentRepository: EnrollmentRepository;
  private enrollmentProgramRepository: EnrollmentProgramRepository;
  private statusHistoryRepository: EnrollmentStatusHistoryRepository;

  constructor(private prisma: PrismaClient) {
    this.learnerRepository = new PrismaLearnerRepository(this.prisma);
    this.enrollmentRepository = new PrismaEnrollmentRepository(this.prisma);
    this.enrollmentProgramRepository = new PrismaEnrollmentProgramRepository(this.prisma);
    this.statusHistoryRepository = new PrismaEnrollmentStatusHistoryRepository(this.prisma);
  }

  @Post()
  async createLearner(@Body() dto: CreateLearnerDto): Promise<LearnerResponseDto> {
    const useCase = new CreateLearnerUseCase(this.learnerRepository);
    const learner = await useCase.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      preferredName: dto.preferredName,
      email: dto.email,
      phone: dto.phone,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    });
    return this.mapLearnerToDto(learner);
  }

  @Get()
  async listLearners(
    @Query('campusId') campusId?: string,
    @Query('cohortId') cohortId?: string,
    @Query('programId') programId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<{
    learners: (LearnerResponseDto & {
      campus?: string;
      cohort?: string;
      currentProgram?: string;
      enrollmentStatus?: string;
    })[];
    total: number;
  }> {
    // Build a complex query to fetch learners with their enrollment info
    let query = this.prisma.learner.findMany({
      include: {
        enrollments: {
          include: {
            cohort: {
              include: { campus: true },
            },
            enrollmentPrograms: {
              include: { programVersion: { include: { program: true } } },
              orderBy: { sequence: 'desc' },
              take: 1,
            },
            statusHistory: {
              orderBy: { effectiveAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1, // Get most recent active enrollment
        },
      },
      skip,
      take,
    });

    // This is a simplified version - full filtering would require more complex logic
    const learners = await query;
    const total = await this.prisma.learner.count();

    return {
      learners: learners.map((l) => {
        const enrollment = l.enrollments[0];
        const currentProgram = enrollment?.enrollmentPrograms[0];
        return {
          ...this.mapLearnerToDto(l),
          campus: enrollment?.cohort?.campus?.name,
          cohort: enrollment?.cohort?.name,
          currentProgram: currentProgram?.programVersion?.program?.name,
          enrollmentStatus: enrollment?.status,
        };
      }),
      total,
    };
  }

  @Get(':id')
  async getLearner(@Param('id') id: string): Promise<LearnerResponseDto & { enrollments?: any[] }> {
    const learner = await this.learnerRepository.findById(id);
    if (!learner) {
      throw new Error(`Learner with id ${id} not found`);
    }

    const enrollments = await this.enrollmentRepository.findByLearnerId(id);
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const programs = await this.enrollmentProgramRepository.findByEnrollmentId(
          enrollment.id,
        );
        const history = await this.statusHistoryRepository.findByEnrollmentId(enrollment.id);
        return { ...enrollment, enrollmentPrograms: programs, statusHistory: history };
      }),
    );

    return {
      ...this.mapLearnerToDto(learner),
      enrollments: enrichedEnrollments,
    };
  }

  @Put(':id')
  async updateLearner(
    @Param('id') id: string,
    @Body() dto: UpdateLearnerDto,
  ): Promise<LearnerResponseDto> {
    const useCase = new UpdateLearnerUseCase(this.learnerRepository);
    const learner = await useCase.execute({
      id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      preferredName: dto.preferredName,
      email: dto.email,
      phone: dto.phone,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    });
    return this.mapLearnerToDto(learner);
  }

  @Post(':learnerId/enrollments')
  async enrollLearner(
    @Param('learnerId') learnerId: string,
    @Body() dto: EnrollLearnerDto,
  ): Promise<EnrollmentResponseDto> {
    const useCase = new EnrollLearnerUseCase(this.enrollmentRepository, this.statusHistoryRepository);
    const enrollment = await useCase.execute({
      learnerId,
      cohortId: dto.cohortId,
      status: dto.status,
      entryType: dto.entryType,
      fundingType: dto.fundingType,
      startDate: new Date(dto.startDate),
      expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
    });
    return this.mapEnrollmentToDto(enrollment);
  }

  @Get(':learnerId/enrollments')
  async getLearnerEnrollments(@Param('learnerId') learnerId: string): Promise<EnrollmentResponseDto[]> {
    const enrollments = await this.enrollmentRepository.findByLearnerId(learnerId);
    return enrollments.map((e) => this.mapEnrollmentToDto(e));
  }

  @Put('enrollments/:enrollmentId/status')
  async changeEnrollmentStatus(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: ChangeEnrollmentStatusDto,
  ): Promise<EnrollmentResponseDto> {
    const useCase = new ChangeEnrollmentStatusUseCase(
      this.enrollmentRepository,
      this.statusHistoryRepository,
    );
    const enrollment = await useCase.execute({
      enrollmentId,
      status: dto.status,
      reason: dto.reason,
    });
    return this.mapEnrollmentToDto(enrollment);
  }

  @Post('enrollments/:enrollmentId/programs')
  async addEnrollmentProgram(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: AddEnrollmentProgramDto,
  ): Promise<EnrollmentProgramResponseDto> {
    const useCase = new AddEnrollmentProgramUseCase(
      this.enrollmentRepository,
      this.enrollmentProgramRepository,
    );
    const program = await useCase.execute({
      enrollmentId,
      programVersionId: dto.programVersionId,
      startDate: new Date(dto.startDate),
      expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
    });
    return this.mapEnrollmentProgramToDto(program);
  }

  @Get('enrollments/:enrollmentId/programs')
  async getEnrollmentPrograms(@Param('enrollmentId') enrollmentId: string): Promise<EnrollmentProgramResponseDto[]> {
    const programs = await this.enrollmentProgramRepository.findByEnrollmentId(enrollmentId);
    return programs.map((p) => this.mapEnrollmentProgramToDto(p));
  }

  private mapLearnerToDto(learner: any): LearnerResponseDto {
    return {
      id: learner.id,
      firstName: learner.firstName,
      lastName: learner.lastName,
      preferredName: learner.preferredName || undefined,
      email: learner.email || undefined,
      phone: learner.phone || undefined,
      birthDate: learner.birthDate?.toISOString().split('T')[0],
      createdAt: learner.createdAt.toISOString(),
      updatedAt: learner.updatedAt.toISOString(),
    };
  }

  private mapEnrollmentToDto(enrollment: any): EnrollmentResponseDto {
    return {
      id: enrollment.id,
      learnerId: enrollment.learnerId,
      cohortId: enrollment.cohortId,
      status: enrollment.status,
      entryType: enrollment.entryType,
      fundingType: enrollment.fundingType,
      startDate: enrollment.startDate.toISOString(),
      expectedEndDate: enrollment.expectedEndDate?.toISOString(),
      actualEndDate: enrollment.actualEndDate?.toISOString(),
      createdAt: enrollment.createdAt.toISOString(),
      updatedAt: enrollment.updatedAt.toISOString(),
    };
  }

  private mapEnrollmentProgramToDto(program: any): EnrollmentProgramResponseDto {
    return {
      id: program.id,
      enrollmentId: program.enrollmentId,
      programVersionId: program.programVersionId,
      sequence: program.sequence,
      status: program.status,
      startDate: program.startDate.toISOString(),
      expectedEndDate: program.expectedEndDate?.toISOString(),
      actualEndDate: program.actualEndDate?.toISOString(),
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  }
}
