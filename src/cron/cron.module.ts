import { Module } from '@nestjs/common';
import { ChargeModule } from 'src/charge/charge.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';

@Module({
  imports: [ChargeModule, EnrollmentsModule],
  controllers: [CronController],
  providers: [CronService],
  exports: [CronModule],
})
export class CronModule {}
