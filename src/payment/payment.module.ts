import { forwardRef, Module } from '@nestjs/common';
import { ChargeModule } from 'src/charge/charge.module';
import { ClientModule } from 'src/client/client.module';
import { CommonModule } from 'src/common/common.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { ProviderModule } from 'src/provider/provider.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

/**
 * Payment Module
 *
 * Responsabilidade: Integração com gateway de pagamento (Stripe)
 *
 * Este módulo é responsável por:
 * - Criar checkout sessions para pagamentos de charges
 * - Criar checkout sessions para assinaturas de providers
 * - Salvar paymentLink nas charges
 * - Delegar webhooks para stripe.service.ts
 *
 * Mapeamento Conceitual:
 * - Este módulo = payment/gateway (conceitualmente)
 *
 * Dependências Circulares:
 * - payment ↔ charge: Usa forwardRef() porque PaymentService atualiza charges com paymentLink.
 *   Pode ser melhorado com Event Emitter (emitir evento quando checkout é criado).
 */
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
