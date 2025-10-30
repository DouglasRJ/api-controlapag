import { Injectable, Logger } from '@nestjs/common';
import { ChargeService } from 'src/charge/charge.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly chargeService: ChargeService,
  ) {}
}
