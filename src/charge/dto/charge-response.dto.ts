import { Charge } from '../entities/charge.entity';
import { CHARGE_STATUS } from '../enum/charge-status.enum';

export class ChargeResponseDto {
  readonly id: string;
  readonly amount: number;
  readonly dueDate: Date;
  readonly status: CHARGE_STATUS;
  readonly paidAt?: Date;
  readonly refundedAmount?: number;
  readonly paymentGatewayId?: string;
  readonly paymentLink?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly enrollmentId: string;

  constructor(charge: Charge) {
    this.id = charge.id;
    this.amount = charge.amount;
    this.dueDate = charge.dueDate;
    this.status = charge.status;
    this.paidAt = charge.paidAt;
    this.refundedAmount = charge.refundedAmount;
    this.paymentGatewayId = charge.paymentGatewayId;
    this.paymentLink = charge.paymentLink;
    this.createdAt = charge.createdAt;
    this.updatedAt = charge.updatedAt;

    if (charge.enrollment) {
      this.enrollmentId = charge.enrollment.id;
    }
  }
}
