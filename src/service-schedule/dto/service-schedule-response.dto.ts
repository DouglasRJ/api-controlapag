import { ServiceSchedule } from '../entities/service-schedule.entity';
import { SERVICE_FREQUENCY } from '../enum/service-frequency.enum';

export class ServiceScheduleResponseDto {
  readonly id: string;
  readonly frequency: SERVICE_FREQUENCY;
  readonly daysOfWeek?: number[];
  readonly dayOfMonth?: number;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(schedule: ServiceSchedule) {
    this.id = schedule.id;
    this.frequency = schedule.frequency;
    this.daysOfWeek = schedule.daysOfWeek;
    this.dayOfMonth = schedule.dayOfMonth;
    this.startTime = schedule.startTime;
    this.endTime = schedule.endTime;
    this.createdAt = schedule.createdAt;
    this.updatedAt = schedule.updatedAt;
  }
}
