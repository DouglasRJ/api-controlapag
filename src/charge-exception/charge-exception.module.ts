import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { ChargeExceptionController } from './charge-exception.controller';
import { ChargeExceptionService } from './charge-exception.service';
import { ChargeException } from './entities/charge-exception.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChargeException]), EnrollmentsModule],
  controllers: [ChargeExceptionController],
  providers: [ChargeExceptionService],
  exports: [ChargeExceptionModule],
})
export class ChargeExceptionModule {}
