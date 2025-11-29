import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { ChargeController } from './charge.controller';
import { ChargeService } from './charge.service';
import { Charge } from './entities/charge.entity';

/**
 * Charge Module
 *
 * Responsabilidade: Gerenciar cobranças/invoices (conceitualmente = BillingInstance)
 *
 * Este módulo é responsável por:
 * - Criar, atualizar e remover cobranças (Charge)
 * - Gerenciar status de cobranças (PENDING, PAID, OVERDUE, CANCELED, REFUNDED, PARTIALLY_REFUNDED, IN_DISPUTE)
 * - Processar reembolsos (refunds)
 * - Marcar cobranças como pagas
 * - Calcular receita por provider
 *
 * Mapeamento Conceitual:
 * - Charge = BillingInstance (documentação)
 * - Este módulo = billing/instances (conceitualmente)
 *
 * Eventos Emitidos:
 * - BillingEvents.PAYMENT_RECEIVED: Quando charge é marcado como PAID
 * - BillingEvents.REFUND_PROCESSED: Quando refund é processado
 *
 * Dependências Circulares:
 * - charge ↔ enrollments: Usa forwardRef() porque ChargeService precisa buscar enrollment
 *   e EnrollmentsService cria charges. Pode ser melhorado com Event Emitter.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Charge]),
    forwardRef(() => EnrollmentsModule),
    forwardRef(() => CommonModule),
  ],
  controllers: [ChargeController],
  providers: [ChargeService],
  exports: [ChargeService],
})
export class ChargeModule {}
