import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateChargeScheduleDto } from 'src/charge-schedule/dto/create-charge-schedule.dto';
import { CreateServiceScheduleDto } from 'src/service-schedule/dto/create-service-schedule.dto';

export class CreateEnrollmentDto {
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  endDate?: Date;

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

  @ValidateNested()
  @Type(() => CreateServiceScheduleDto)
  @IsNotEmpty()
  serviceSchedule: CreateServiceScheduleDto;
}
