import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class CreateLearnerDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

export class UpdateLearnerDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

export class LearnerResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  createdAt!: string;
  updatedAt!: string;
}
