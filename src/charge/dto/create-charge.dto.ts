import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsString,
  IsEnum,
} from 'class-validator';
import { CHARGE_STATUS } from '../enum/charge-status.enum';

export class CreateChargeDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsEnum(CHARGE_STATUS)
  @IsOptional()
  status?: CHARGE_STATUS;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  refundedAmount?: number;

  @IsString()
  @IsOptional()
  paymentGatewayId?: string;

  @IsString()
  @IsOptional()
  paymentLink?: string;
}
