import { Controller } from '@nestjs/common';
import { ServiceScheduleService } from './service-schedule.service';
@Controller('serviceSchedules')
export class ServiceScheduleSchedulesController {
  constructor(
    private readonly serviceScheduleService: ServiceScheduleService,
  ) {}
}
