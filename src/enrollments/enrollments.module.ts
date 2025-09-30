import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from 'src/services/services.module';
import { UserModule } from 'src/user/user.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollments } from './entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollments]),
    UserModule,
    ServicesModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
