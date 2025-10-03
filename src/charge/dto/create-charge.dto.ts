import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateChargeDto {
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

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
}
