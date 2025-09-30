import { ChargeSchedule } from '../entities/charge-schedule.entity';
import { BILLING_MODEL } from '../enum/billing-model.enum';
import { RECURRENCE_INTERVAL } from '../enum/recurrence-interval.enum';

export class ChargeScheduleResponseDto {
  readonly id: string;
  readonly billingModel: BILLING_MODEL;
  readonly recurrenceInterval?: RECURRENCE_INTERVAL;
  readonly chargeDay: number;
  readonly dueDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(chargeSchedule: ChargeSchedule) {
    this.id = chargeSchedule.id;
    this.billingModel = chargeSchedule.billingModel;
    this.recurrenceInterval = chargeSchedule.recurrenceInterval;
    this.chargeDay = chargeSchedule.chargeDay;
    this.dueDate = chargeSchedule.dueDate;
    this.createdAt = chargeSchedule.createdAt;
    this.updatedAt = chargeSchedule.updatedAt;
  }
}
