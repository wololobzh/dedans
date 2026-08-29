import { IsString, IsIn, IsDateString, IsOptional } from 'class-validator';
import { EntryType, FundingType, EnrollmentStatus } from '@school-erp/domain';

const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'pre_registered',
  'registered',
  'active',
  'suspended',
  'withdrawn',
  'completed',
  'excluded',
];
const ENTRY_TYPES: EntryType[] = ['standard', 'parallel_admission', 'transfer', 'reentry'];
const FUNDING_TYPES: FundingType[] = [
  'personal',
  'apprenticeship',
  'transition_pro',
  'cpf',
  'company',
  'other',
];

export class EnrollLearnerDto {
  @IsString()
  learnerId!: string;

  @IsString()
  cohortId!: string;

  @IsIn(ENROLLMENT_STATUSES)
  status!: EnrollmentStatus;

  @IsIn(ENTRY_TYPES)
  entryType!: EntryType;

  @IsIn(FUNDING_TYPES)
  fundingType!: FundingType;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;
}

export class EnrollmentResponseDto {
  id!: string;
  learnerId!: string;
  cohortId!: string;
  status!: EnrollmentStatus;
  entryType!: EntryType;
  fundingType!: FundingType;
  startDate!: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  createdAt!: string;
  updatedAt!: string;
}

export class ChangeEnrollmentStatusDto {
  @IsIn(ENROLLMENT_STATUSES)
  status!: EnrollmentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddEnrollmentProgramDto {
  @IsString()
  programVersionId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  expectedEndDate?: string;
}

export class EnrollmentProgramResponseDto {
  id!: string;
  enrollmentId!: string;
  programVersionId!: string;
  sequence!: number;
  status!: string;
  startDate!: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  createdAt!: string;
  updatedAt!: string;
}
