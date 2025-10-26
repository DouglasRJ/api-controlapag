import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeScheduleModule } from 'src/charge-schedule/charge-schedule.module';
import { ClientModule } from 'src/client/client.module';
import { ServiceSchedule } from 'src/service-schedule/entities/service-schedule.entity';
import { ServiceScheduleModule } from 'src/service-schedule/service-schedule.module';
import { ServicesModule } from 'src/services/services.module';
import { UserModule } from 'src/user/user.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollments } from './entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollments, ServiceSchedule]),
    forwardRef(() => UserModule),
    forwardRef(() => ServicesModule),
    forwardRef(() => ClientModule),
    forwardRef(() => ServiceScheduleModule),
    forwardRef(() => ChargeScheduleModule),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
