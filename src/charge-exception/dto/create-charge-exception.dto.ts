import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { EXCEPTION_ACTION } from '../enum/exception-action.enum';

export class CreateChargeExceptionDto {
  @IsDateString()
  @IsNotEmpty()
  originalChargeDate: string;

  @IsEnum(EXCEPTION_ACTION)
  @IsNotEmpty()
  action: EXCEPTION_ACTION;

  @IsDateString()
  @ValidateIf(
    (object: CreateChargeExceptionDto) =>
      object.action === EXCEPTION_ACTION.POSTPONE,
  )
  @IsNotEmpty({
    message: 'newDueDate must be provided when action is POSTPONE',
  })
  @IsOptional()
  newDueDate?: string;

  @IsNumber()
  @ValidateIf(
    (object: CreateChargeExceptionDto) =>
      object.action === EXCEPTION_ACTION.MODIFY_AMOUNT,
  )
  @IsNotEmpty({
    message: 'newAmount must be provided when action is MODIFY_AMOUNT',
  })
  @IsOptional()
  newAmount?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
