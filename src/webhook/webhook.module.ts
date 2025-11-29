import { forwardRef, Module } from '@nestjs/common';
import { PaymentModule } from 'src/payment/payment.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

/**
 * Webhook Module
 *
 * Responsabilidade: Handlers de webhooks do Stripe
 *
 * Este módulo é responsável por:
 * - Receber webhooks do Stripe (Connect e Platform)
 * - Validar assinatura dos webhooks
 * - Delegar processamento para payment.service.ts
 *
 * Mapeamento Conceitual:
 * - Este módulo = webhook/handlers (conceitualmente)
 *
 * Endpoints:
 * - POST /webhook/stripe: Webhooks de contas conectadas (Stripe Connect)
 * - POST /webhook/stripe-platform: Webhooks da plataforma (Stripe Platform)
 */
@Module({
  imports: [forwardRef(() => PaymentModule)],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
