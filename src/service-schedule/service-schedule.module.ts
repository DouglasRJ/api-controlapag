import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceSchedule } from './entities/service-schedule.entity';
import { ServiceScheduleService } from './service-schedule.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceSchedule])],
  providers: [ServiceScheduleService],
  exports: [ServiceScheduleService],
})
export class ServiceScheduleModule {}
