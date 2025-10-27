import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ENROLLMENT_STATUS } from '../enum/enrollment-status.enum';
import { CreateEnrollmentDto } from './create-enrollment.dto';

export class UpdateEnrollmentDto extends PartialType(CreateEnrollmentDto) {
  @IsEnum(ENROLLMENT_STATUS)
  @IsOptional()
  status?: ENROLLMENT_STATUS;
}
