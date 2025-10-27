import { forwardRef, Module } from '@nestjs/common';
import { ChargeModule } from 'src/charge/charge.module';
import { ClientModule } from 'src/client/client.module';
import { CommonModule } from 'src/common/common.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { ProviderModule } from 'src/provider/provider.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    forwardRef(() => ChargeModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => ClientModule),
    forwardRef(() => EnrollmentsModule),
    forwardRef(() => CommonModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
