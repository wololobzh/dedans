import { IsString, IsIn, IsDateString, IsOptional, IsInt } from 'class-validator';
import { ProgramCategory } from '@school-erp/domain';

const PROGRAM_CATEGORIES: ProgramCategory[] = ['foundation', 'specialization', 'other'];

export class CreateProgramDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsIn(PROGRAM_CATEGORIES)
  category!: ProgramCategory;
}

export class CreateProgramVersionDto {
  @IsString()
  programId!: string;

  @IsString()
  version!: string;

  @IsDateString()
  startValidity!: string;

  @IsOptional()
  @IsDateString()
  endValidity?: string;

  @IsOptional()
  @IsInt()
  durationHours?: number;

  @IsOptional()
  @IsInt()
  durationMonths?: number;
}

export class ProgramResponseDto {
  id!: string;
  name!: string;
  code!: string;
  category!: ProgramCategory;
  active!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class ProgramVersionResponseDto {
  id!: string;
  programId!: string;
  version!: string;
  startValidity!: string;
  endValidity?: string;
  durationHours?: number;
  durationMonths?: number;
  active!: boolean;
  createdAt!: string;
  updatedAt!: string;
}
