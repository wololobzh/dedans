import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, Validate, ValidateIf, ValidatorConstraint, type ValidationArguments, type ValidatorConstraintInterface } from 'class-validator';
import { isValidIanaTimezone } from '@school-erp/domain';

@ValidatorConstraint({ name: 'ianaTimezone', async: false })
class IanaTimezoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _arguments: ValidationArguments): boolean { return typeof value === 'string' && isValidIanaTimezone(value); }
  defaultMessage(): string { return 'timezone must be a valid IANA timezone'; }
}

export enum CampusTypeDto {
  Physical = 'physical',
  Virtual = 'virtual',
}

export enum CampusStatusQuery {
  Active = 'active',
  Inactive = 'inactive',
  All = 'all',
}

export class ListCampusesQueryDto {
  @IsOptional() @IsEnum(CampusStatusQuery) status?: CampusStatusQuery;
}

export class CreateCampusDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) code!: string;
  @ValidateIf((dto: CreateCampusDto) => dto.type === CampusTypeDto.Physical || (dto.city !== undefined && dto.city !== null)) @IsString() @IsNotEmpty() @MaxLength(200) city?: string | null;
  @IsEnum(CampusTypeDto) type!: CampusTypeDto;
  @IsString() @IsNotEmpty() @MaxLength(100) @Validate(IanaTimezoneConstraint) timezone!: string;
}
export class UpdateCampusDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(50) code?: string;
  @IsOptional() @ValidateIf((dto: UpdateCampusDto) => dto.city !== null) @IsString() @IsNotEmpty() @MaxLength(200) city?: string | null;
}
export class DeactivateCampusDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) reason!: string;
}