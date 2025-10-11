import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import { BILLING_MODEL } from '../enum/billing-model.enum';
import { RECURRENCE_INTERVAL } from '../enum/recurrence-interval.enum';

export class CreateChargeScheduleDto {
  @IsEnum(BILLING_MODEL)
  @IsNotEmpty()
  billingModel: BILLING_MODEL;

  @IsEnum(RECURRENCE_INTERVAL)
  @ValidateIf(
    (c: CreateChargeScheduleDto) => c.billingModel === BILLING_MODEL.RECURRING,
  )
  recurrenceInterval?: RECURRENCE_INTERVAL;

  @IsNumber()
  @IsNotEmpty()
  chargeDay: number;

  @IsDateString()
  dueDate?: Date;
}
