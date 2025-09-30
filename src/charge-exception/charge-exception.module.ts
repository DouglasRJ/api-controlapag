import { Module } from '@nestjs/common';
import { ChargeExceptionService } from './charge-exception.service';
import { ChargeExceptionController } from './charge-exception.controller';

@Module({
  controllers: [ChargeExceptionController],
  providers: [ChargeExceptionService],
})
export class ChargeExceptionModule {}
