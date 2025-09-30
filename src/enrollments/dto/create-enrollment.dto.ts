import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateChargeScheduleDto } from 'src/charge-schedule/dto/create-charge-schedule.dto';

export class CreateEnrollmentDto {
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
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
}
