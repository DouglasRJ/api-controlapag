import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChargeService } from 'src/charge/charge.service';
import { BillingEvents } from 'src/common/events/events';
import { EmailService } from 'src/common/email/email.service';
import { OrganizationService } from 'src/organization/organization.service';
import { UserService } from 'src/user/user.service';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { WhatsappService } from 'src/common/whatsapp/whatsapp.service';

@Injectable()
export class BillingNotificationListener {
  private readonly logger = new Logger(BillingNotificationListener.name);

  constructor(
    private readonly chargeService: ChargeService,
    private readonly emailService: EmailService,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @OnEvent(BillingEvents.PAYMENT_RECEIVED)
  async handlePaymentReceived(payload: { charge: any; paidAt: Date }) {
    this.logger.log(
      `Payment received event for charge ${payload.charge.id}`,
    );

    try {
      // Buscar charge com enrollment
      const charge = await this.chargeService.findOneByOrFail(
        { id: payload.charge.id },
        true,
      );

      if (!charge.enrollment) {
        this.logger.warn(
          `Charge ${charge.id} does not have enrollment. Cannot send WhatsApp notification.`,
        );
        return;
      }

      // Buscar enrollment com cliente usando EnrollmentsService
      // Por enquanto, apenas logamos a intenção de enviar WhatsApp
      // O enrollment já vem com a relação, mas pode não ter o client carregado
      // TODO: Implementar busca completa do enrollment com client quando necessário
      this.logger.log(
        `Payment received for charge ${charge.id}, enrollment ${charge.enrollment.id}. WhatsApp notification can be implemented when template is available.`,
      );

      // TODO: Implementar envio de WhatsApp quando template estiver disponível
      // 1. Buscar enrollment completo com client
      // 2. Verificar se client tem phone
      // 3. Enviar WhatsApp usando template
      // await this.whatsappService.sendTemplateMessage({
      //   to: client.phone,
      //   templateSid: 'TWILIO_TEMPLATE_SID',
      //   contentVariables: {
      //     chargeId: charge.id,
      //     amount: charge.amount.toString(),
      //   },
      // });
    } catch (error) {
      this.logger.error(
        `Failed to handle payment received notification for charge ${payload.charge.id}`,
        error,
      );
    }
  }

  @OnEvent(BillingEvents.REFUND_PROCESSED)
  async handleRefundProcessed(payload: {
    charge: any;
    refundAmount: number;
    totalRefunded: number;
    reason?: string;
  }) {
    this.logger.log(
      `Refund processed event for charge ${payload.charge.id}`,
    );

    // Por enquanto, apenas logamos
    // Pode ser expandido para enviar notificações se necessário
  }

  @OnEvent(BillingEvents.DISPUTE_CREATED)
  async handleDisputeCreated(payload: {
    charge: any;
    dispute: {
      id: string;
      amount: number;
      reason: string;
      status: string;
    };
  }) {
    this.logger.log(
      `Dispute created event for charge ${payload.charge.id}`,
    );

    try {
      const charge = payload.charge;

      if (!charge.organizationId) {
        this.logger.warn(
          `Charge ${charge.id} does not have organizationId. Cannot notify MASTER.`,
        );
        return;
      }

      // Buscar organização e MASTER
      const organization = await this.organizationService.findOne(
        charge.organizationId,
      );
      const masterUser = await this.userService.findOneByOrFail({
        id: organization.ownerId,
      });

      // Verificar se o usuário é realmente MASTER
      if (
        masterUser.role === USER_ROLE.MASTER &&
        masterUser.organizationId === charge.organizationId
      ) {
        // Enviar email de notificação
        await this.emailService.sendEmail({
          to: masterUser.email,
          subject: `⚠️ Contestação de Pagamento - Charge ${charge.id}`,
          html: `
            <h1>Contestação de Pagamento Recebida</h1>
            <p>Olá ${masterUser.username},</p>
            <p>Uma contestação (dispute) foi criada para uma cobrança na sua organização.</p>
            <h2>Detalhes da Contestação:</h2>
            <ul>
              <li><strong>ID da Contestação:</strong> ${payload.dispute.id}</li>
              <li><strong>ID da Cobrança:</strong> ${charge.id}</li>
              <li><strong>Valor Contestado:</strong> R$ ${payload.dispute.amount.toFixed(2)}</li>
              <li><strong>Motivo:</strong> ${payload.dispute.reason}</li>
              <li><strong>Status:</strong> ${payload.dispute.status}</li>
            </ul>
            <p>Por favor, revise a contestação no painel do Stripe e tome as ações necessárias.</p>
            <p>O status da cobrança foi atualizado para <strong>IN_DISPUTE</strong>.</p>
          `,
        });

        this.logger.log(
          `Dispute notification email sent to MASTER ${masterUser.email} for organization ${charge.organizationId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle dispute created notification for charge ${payload.charge.id}`,
        error,
      );
    }
  }
}

