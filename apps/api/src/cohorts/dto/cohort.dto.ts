import { IsString, IsDateString, IsIn, IsOptional } from 'class-validator';
import { CohortStatus } from '@school-erp/domain';

const COHORT_STATUSES: CohortStatus[] = ['planned', 'recruiting', 'active', 'completed', 'cancelled'];

export class CreateCohortDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  campusId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;

  @IsIn(COHORT_STATUSES)
  status!: CohortStatus;
}

export class UpdateCohortDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsIn(COHORT_STATUSES)
  status?: CohortStatus;
}

export class CohortResponseDto {
  id!: string;
  code!: string;
  name!: string;
  campusId!: string;
  startDate!: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status!: CohortStatus;
  createdAt!: string;
  updatedAt!: string;
}
