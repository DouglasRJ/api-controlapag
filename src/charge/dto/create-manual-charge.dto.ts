import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreateManualChargeDto {
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @Type(() => Date)
  @IsDate()
  dueDate: Date;
}
