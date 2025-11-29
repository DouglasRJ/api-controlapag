import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeScheduleModule } from 'src/charge-schedule/charge-schedule.module';
import { ChargeModule } from 'src/charge/charge.module';
import { ClientModule } from 'src/client/client.module';
import { ServiceSchedule } from 'src/service-schedule/entities/service-schedule.entity';
import { ServiceScheduleModule } from 'src/service-schedule/service-schedule.module';
import { ServicesModule } from 'src/services/services.module';
import { UserModule } from 'src/user/user.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollments } from './entities/enrollment.entity';

/**
 * Enrollments Module
 *
 * Responsabilidade: Gerenciar contratos/matrículas (conceitualmente = Contract)
 *
 * Este módulo é responsável por:
 * - Criar, atualizar e remover contratos (Enrollments)
 * - Gerenciar ciclo de vida do contrato (ACTIVE, PAUSED, CANCELLED, COMPLETED)
 * - Gerar cobranças futuras baseadas no ChargeSchedule
 * - Validar propriedade do contrato (ownership)
 * - Gerenciar ServiceSchedule associados ao contrato
 *
 * Mapeamento Conceitual:
 * - Enrollments = Contract (documentação)
 * - Este módulo = billing/contracts (conceitualmente)
 *
 * Dependências Circulares:
 * - enrollments ↔ charge: Usa forwardRef() porque EnrollmentsService cria charges
 *   e ChargeService precisa buscar enrollment. Pode ser melhorado com Event Emitter.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollments, ServiceSchedule]),
    forwardRef(() => UserModule),
    forwardRef(() => ServicesModule),
    forwardRef(() => ClientModule),
    forwardRef(() => ServiceScheduleModule),
    forwardRef(() => ChargeScheduleModule),
    forwardRef(() => ChargeModule),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
