import { forwardRef, Module } from '@nestjs/common';
import { PaymentModule } from 'src/payment/payment.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [forwardRef(() => PaymentModule)],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
