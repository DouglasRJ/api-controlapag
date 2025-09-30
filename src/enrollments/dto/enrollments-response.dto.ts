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

  constructor(enrollment: Enrollments) {
    this.id = enrollment.id;
    this.price = enrollment.price;
    this.startDate = enrollment.startDate;
    this.endDate = enrollment.endDate;
    this.status = enrollment.status;
    this.createdAt = enrollment.createdAt;
    this.updatedAt = enrollment.updatedAt;
  }
}
