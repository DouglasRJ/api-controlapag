import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { ChargeController } from './charge.controller';
import { ChargeService } from './charge.service';
import { Charge } from './entities/charge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Charge]), EnrollmentsModule],
  controllers: [ChargeController],
  providers: [ChargeService],
  exports: [ChargeService],
})
export class ChargeModule {}
