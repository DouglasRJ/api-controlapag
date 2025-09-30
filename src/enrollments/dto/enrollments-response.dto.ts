import { ChargeExceptionResponseDto } from 'src/charge-exception/dto/charge-exception-response.dto';
import { ChargeScheduleResponseDto } from 'src/charge-schedule/dto/charge-schedule-response.dto';
import { Enrollments } from '../entities/enrollment.entity';
import { ENROLLMENT_STATUS } from '../enum/enrollment-status.enum';

export class EnrollmentsResponseDto {
  readonly id: string;
  readonly price: number;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly status: ENROLLMENT_STATUS;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  readonly chargeSchedule?: ChargeScheduleResponseDto;
  readonly chargeExceptions?: ChargeExceptionResponseDto[];

  constructor(enrollment: Enrollments) {
    this.id = enrollment.id;
    this.price = enrollment.price;
    this.startDate = enrollment.startDate;
    this.endDate = enrollment.endDate;
    this.status = enrollment.status;
    this.createdAt = enrollment.createdAt;
    this.updatedAt = enrollment.updatedAt;

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
  }
}
