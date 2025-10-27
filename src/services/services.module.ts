import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import { ServiceScheduleModule } from 'src/service-schedule/service-schedule.module';
import { UserModule } from 'src/user/user.module';
import { Service } from './entities/service.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, Enrollments]),
    forwardRef(() => UserModule),
    forwardRef(() => ServiceScheduleModule),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
