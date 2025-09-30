import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { EXCEPTION_ACTION } from '../enum/exception-action.enum';

export class CreateChargeExceptionDto {
  @IsDate()
  @IsNotEmpty()
  originalChargeDate: Date;

  @IsEnum(EXCEPTION_ACTION)
  @IsNotEmpty()
  action: EXCEPTION_ACTION;

  @IsDate()
  newDueDate?: Date;

  @IsNumber()
  newAmount?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
