import { ChargeException } from '../entities/charge-exception.entity';
import { EXCEPTION_ACTION } from '../enum/exception-action.enum';

export class ChargeExceptionResponseDto {
  readonly id: string;
  readonly originalChargeDate: Date;
  readonly action: EXCEPTION_ACTION;
  readonly newDueDate?: Date;
  readonly newAmount?: number;
  readonly reason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(chargeException: ChargeException) {
    this.id = chargeException.id;
    this.originalChargeDate = chargeException.originalChargeDate;
    this.action = chargeException.action;
    this.newDueDate = chargeException.newDueDate;
    this.newAmount = chargeException.newAmount;
    this.reason = chargeException.reason;
    this.createdAt = chargeException.createdAt;
    this.updatedAt = chargeException.updatedAt;
  }
}
