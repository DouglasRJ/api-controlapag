import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateChargeScheduleDto } from 'src/charge-schedule/dto/create-charge-schedule.dto';
import { CreateServiceScheduleSimpleDto } from 'src/service-schedule/dto/create-service-schedule.dto';

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
}
