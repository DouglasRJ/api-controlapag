import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateChargeScheduleDto } from 'src/charge-schedule/dto/create-charge-schedule.dto';
import { CreateServiceScheduleSimpleDto } from 'src/service-schedule/dto/create-service-schedule.dto';
import { BILLING_TYPE } from '../enum/billing-type.enum';

export class CreateEnrollmentDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ValidateNested()
  @Type(() => CreateChargeScheduleDto)
  @IsNotEmpty()
  chargeSchedule: CreateChargeScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateServiceScheduleSimpleDto)
  serviceSchedules?: CreateServiceScheduleSimpleDto;

  @IsOptional()
  @IsEnum(BILLING_TYPE)
  billingType?: BILLING_TYPE;

  @IsOptional()
  @IsDateString()
  pauseStartDate?: string;

  @IsOptional()
  @IsDateString()
  pauseEndDate?: string;
}
