import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeScheduleController } from './charge-schedule.controller';
import { ChargeScheduleService } from './charge-schedule.service';
import { ChargeSchedule } from './entities/charge-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChargeSchedule])],
  controllers: [ChargeScheduleController],
  providers: [ChargeScheduleService],
  exports: [ChargeScheduleService],
})
export class ChargeScheduleModule {}
