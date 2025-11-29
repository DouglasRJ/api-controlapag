import { ChargeExceptionResponseDto } from 'src/charge-exception/dto/charge-exception-response.dto';
import { ChargeScheduleResponseDto } from 'src/charge-schedule/dto/charge-schedule-response.dto';
import { ChargeResponseDto } from 'src/charge/dto/charge-response.dto';
import { Client } from 'src/client/entities/client.entity';
import { ServiceScheduleResponseDto } from 'src/service-schedule/dto/service-schedule-response.dto';
import { Service } from 'src/services/entities/service.entity';
import { Enrollments } from '../entities/enrollment.entity';
import { BILLING_TYPE } from '../enum/billing-type.enum';
import { ENROLLMENT_STATUS } from '../enum/enrollment-status.enum';

export class EnrollmentsResponseDto {
  readonly id: string;
  readonly price: number;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly status: ENROLLMENT_STATUS;
  readonly billingType?: BILLING_TYPE;
  readonly pauseStartDate?: Date;
  readonly pauseEndDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  readonly chargeSchedule?: ChargeScheduleResponseDto;
  readonly chargeExceptions?: ChargeExceptionResponseDto[];
  readonly serviceSchedules?: ServiceScheduleResponseDto[];
  readonly charges?: ChargeResponseDto[];

  readonly client: Client;
  readonly service: Service;

  constructor(enrollment: Enrollments) {
    this.id = enrollment.id;
    this.price = enrollment.price;
    this.startDate = enrollment.startDate;
    this.endDate = enrollment.endDate;
    this.status = enrollment.status;
    this.billingType = enrollment.billingType;
    this.pauseStartDate = enrollment.pauseStartDate;
    this.pauseEndDate = enrollment.pauseEndDate;
    this.createdAt = enrollment.createdAt;
    this.updatedAt = enrollment.updatedAt;
    this.client = enrollment.client;
    this.service = enrollment.service;

    if (enrollment.chargeSchedule) {
      this.chargeSchedule = new ChargeScheduleResponseDto(
        enrollment.chargeSchedule,
      );
    }

    if (enrollment.chargeExceptions) {
      this.chargeExceptions = enrollment.chargeExceptions.map(
        ce => new ChargeExceptionResponseDto(ce),
      );
    }

    if (enrollment.serviceSchedules) {
      this.serviceSchedules = enrollment.serviceSchedules.map(
        s => new ServiceScheduleResponseDto(s),
      );
    }

    if (enrollment.charges) {
      this.charges = enrollment.charges.map(c => new ChargeResponseDto(c));
    }
  }
}
