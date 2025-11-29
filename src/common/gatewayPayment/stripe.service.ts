import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Charge } from 'src/charge/entities/charge.entity';
import { ChargeService } from 'src/charge/charge.service';
import { CHARGE_STATUS } from 'src/charge/enum/charge-status.enum';
import { BillingEvents } from 'src/common/events/events';
import { EmailService } from 'src/common/email/email.service';
import { OrganizationService } from 'src/organization/organization.service';
import { PROVIDER_STATUS } from 'src/provider/enum/provider-status.enum';
import { ProviderService } from 'src/provider/provider.service';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { UserService } from 'src/user/user.service';
import Stripe from 'stripe';
import { GatewayPaymentService } from './gateway-payment.service';
import { Balance, Payout } from './types/gateway.dtos';

/**
 * Stripe Service
 *
 * Responsabilidade: Implementação do GatewayPaymentService usando Stripe
 *
 * Este serviço é responsável por:
 * - Criar customers, checkouts, subscriptions no Stripe
 * - Processar webhooks do Stripe (Connect e Platform)
 * - Gerenciar connected accounts (Stripe Connect)
 * - Processar reembolsos
 * - Atualizar charges quando pagamentos são confirmados
 * - Atualizar charges quando disputes são criados
 *
 * Eventos Emitidos:
 * - BillingEvents.DISPUTE_CREATED: Quando dispute é recebido do Stripe
 *
 * Dependências Circulares:
 * - Usa forwardRef() para ChargeService, ProviderService, UserService, OrganizationService, EmailService
 * - Justificado: Serviço compartilhado que precisa acessar múltiplos módulos
 */
@Injectable()
export class StripeService implements GatewayPaymentService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private webhookSecret: string;
  private platformWebhookSecret: string;
  private frontendBaseUrl: string;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    @Inject(forwardRef(() => ChargeService))
    private readonly chargeService: ChargeService,
    @Inject(forwardRef(() => OrganizationService))
    private readonly organizationService: OrganizationService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const configStripeApiKey = this.configService.get<string>('STRIPE_API_KEY');
    if (!configStripeApiKey) {
      throw new InternalServerErrorException('Stripe API Key not configured.');
    }
    this.stripe = new Stripe(configStripeApiKey, {
      // httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });

    const configWebhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!configWebhookSecret) {
      throw new InternalServerErrorException(
        'Stripe Webhook Secret not configured.',
      );
    }

    this.webhookSecret = configWebhookSecret;

    const configPlatformWebhookSecret = this.configService.get<string>(
      'STRIPE_PLATFORM_WEBHOOK_SECRET',
    );
    if (configPlatformWebhookSecret) {
      this.platformWebhookSecret = configPlatformWebhookSecret;
      this.logger.log('Platform webhook secret configured.');
    } else {
      this.logger.warn(
        'STRIPE_PLATFORM_WEBHOOK_SECRET not configured. Platform webhook endpoint will not work.',
      );
      this.platformWebhookSecret = '';
    }

    this.frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:8081',
    );
  }

  async createSubscriptionCheckout(options: {
    customerEmail: string;
    clientReferenceId: string;
    planId: string;
  }): Promise<{ url: string }> {
    const customer = await this.createCustomer({
      email: options.customerEmail,
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: options.clientReferenceId,
      customer: customer.id,
      success_url: `${this.frontendBaseUrl}/subscription/success`,
      cancel_url: `${this.frontendBaseUrl}/subscription/error`,
      line_items: [{ price: options.planId, quantity: 1 }],
    });

    if (!session.url) {
      throw new BadRequestException('Subscription checkout URL not created');
    }
    return { url: session.url };
  }

  async createChargePaymentCheckout(options: {
    customerEmail: string;
    clientReferenceId: string;
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    onBehalfOfAccountId: string;
    applicationFeeAmount: number;
    enrollmentId?: string;
    serviceId?: string;
  }): Promise<{ url: string; sessionId?: string }> {
    const customer = await this.createCustomer({
      email: options.customerEmail,
    });

    const successUrl = options.enrollmentId
      ? `${this.frontendBaseUrl}/enrollments/${options.enrollmentId}`
      : `${this.frontendBaseUrl}/services`;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      mode: 'payment',
      client_reference_id: options.clientReferenceId,
      customer: customer.id,
      success_url: successUrl,
      cancel_url: `${this.frontendBaseUrl}/payment/error`,
      line_items: options.lineItems,
      payment_intent_data: {
        application_fee_amount: options.applicationFeeAmount,
        transfer_data: {
          destination: options.onBehalfOfAccountId,
        },
        on_behalf_of: options.onBehalfOfAccountId,
      },
    });

    if (!session.url) {
      throw new BadRequestException('Charge payment checkout URL not created');
    }
    return { url: session.url, sessionId: session.id };
  }

  async getStripeCustomerByEmail(email: string) {
    const customer = await this.stripe.customers.list({ email });
    return customer.data[0];
  }

  async createCustomer(data: { email: string; name?: string }) {
    const customer = await this.getStripeCustomerByEmail(data.email);
    if (customer) return customer;

    return this.stripe.customers.create({
      email: data.email,
      name: data.name,
    });
  }

  async handleCheckoutSessionCompleted(event: {
    data: { object: Stripe.Checkout.Session };
  }) {
    const session = event.data.object;
    const checkoutStatus = session.status;

    if (checkoutStatus !== 'complete') {
      return;
    }

    if (session.mode === 'subscription') {
      this.logger.log(`Handling completed subscription session...`);
      const userId = session.client_reference_id;
      const stripeSubscriptionId = session.subscription as string;
      const stripeCustomerId = session.customer as string;

      if (!userId || !stripeSubscriptionId || !stripeCustomerId) {
        throw new BadRequestException(
          'Subscription session is missing required data.',
        );
      }

      const user = await this.userService.findOneByOrFail({ id: userId });
      const provider = await this.providerService.findOneByOrFail({
        id: user.providerProfile.id,
      });

      await this.providerService.update({
        providerId: provider.id,
        userId: user.id,
        updateProviderDto: {
          paymentCustomerId: stripeCustomerId,
          subscriptionId: stripeSubscriptionId,
          status: PROVIDER_STATUS.ACTIVE,
        },
      });
      this.logger.log(`Provider ${provider.id} subscription activated.`);
    }

    if (session.mode === 'payment') {
      this.logger.log(`Handling completed payment session...`);
      const chargeId = session.client_reference_id;

      if (!chargeId) {
        throw new BadRequestException('Payment session is missing charge ID.');
      }

      // Buscar payment intent da session
      let paymentIntentId: string | null = null;
      if (session.payment_intent) {
        paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent.id;
      }

      // Atualizar charge com paymentGatewayId se disponível
      if (paymentIntentId) {
        await this.chargeService.update({
          chargeId,
          updateChargeDto: {
            paymentGatewayId: paymentIntentId,
            status: CHARGE_STATUS.PAID,
            paidAt: new Date().toISOString(),
          },
        });
      } else {
        await this.chargeService.markAsPaid(chargeId, new Date());
      }

      this.logger.log(
        `Charge ${chargeId} marked as PAID${paymentIntentId ? ` with paymentGatewayId: ${paymentIntentId}` : ''}.`,
      );
    }
  }

  async handleSubscriptionSessionCompleted(event: {
    data: { object: Stripe.Subscription };
  }) {
    const { object: data } = event.data;

    const stripeCustomerId = data.customer as string;
    const stripeSubscriptionId = data.id;

    const provider = await this.providerService.findOneByOrFail({
      paymentCustomerId: stripeCustomerId,
    });

    await this.providerService.update({
      providerId: provider.id,
      userId: provider.user.id,
      updateProviderDto: {
        paymentCustomerId: stripeCustomerId,
        subscriptionId: stripeSubscriptionId,
        status: PROVIDER_STATUS.ACTIVE,
      },
    });
  }

  async handleCancelPlan(event: { data: { object: Stripe.Subscription } }) {
    const { object: data } = event.data;
    const stripeCustomerId = data.customer as string;

    const provider = await this.providerService.findOneByOrFail({
      paymentCustomerId: stripeCustomerId,
    });

    await this.providerService.update({
      providerId: provider.id,
      userId: provider.user.id,
      updateProviderDto: {
        paymentCustomerId: stripeCustomerId,
        status: PROVIDER_STATUS.INACTIVE,
      },
    });
  }

  async handleCancelSubscription(idSubscription: string) {
    const subscription = await this.stripe.subscriptions.update(
      idSubscription,
      {
        cancel_at_period_end: true,
      },
    );

    return subscription;
  }

  async handleWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;

    this.logger.log(
      `Attempting to verify CONNECT webhook signature. Secret length: ${this.webhookSecret.length}`,
    );

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `CONNECT webhook signature verification failed. Secret starts with: ${this.webhookSecret.substring(0, 10)}...`,
        err,
      );
      throw new BadRequestException(`Webhook error: ${err}`);
    }

    this.logger.log(`Received Stripe Connect event: ${event.type}`);

    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;

      default:
        this.logger.warn(`Unhandled Connect event type ${event.type}`);
    }

    return { received: true };
  }

  async handlePlatformWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;

    this.logger.log(
      `Attempting to verify PLATFORM webhook signature. Secret length: ${this.platformWebhookSecret.length}`,
    );

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.platformWebhookSecret,
      );
    } catch (err) {
      this.logger.error(
        `PLATFORM webhook signature verification failed. Secret starts with: ${this.platformWebhookSecret.substring(0, 10)}...`,
        err,
      );
      throw new BadRequestException(`Webhook error: ${err}`);
    }

    this.logger.log(`Received Stripe platform event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionSessionCompleted(event);
        break;
      case 'customer.subscription.deleted':
        await this.handleCancelPlan(event);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      case 'charge.refunded':
      case 'refund.created':
        await this.handleChargeRefunded(
          event.data.object as unknown as Stripe.Refund,
        );
        break;
      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object);
        break;

      default:
        this.logger.warn(`Unhandled platform event type ${event.type}`);
    }

    return { received: true };
  }

  async createConnectedAccount(options: {
    email: string;
  }): Promise<{ id: string }> {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email: options.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return { id: account.id };
  }

  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return { url: accountLink.url };
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    this.logger.log(
      `Webhook account.updated received for account: ${account.id}`,
    );

    if (account.payouts_enabled) {
      this.logger.log(
        `Payouts enabled for account ${account.id}. Attempting to find provider.`,
      );
      try {
        const provider = await this.providerService.findOneByOrFail({
          providerPaymentId: account.id,
        });

        this.logger.log(
          `Provider found: ${provider.id}, current status: ${provider.status}`,
        );

        if (provider && provider.status !== PROVIDER_STATUS.ACTIVE) {
          this.logger.log(
            `Provider account ${account.id} needs status update. Current: ${provider.status}, Target: ${PROVIDER_STATUS.ACTIVE}. Calling providerService.update...`,
          );

          if (!provider.user || !provider.user.id) {
            this.logger.error(
              `Provider ${provider.id} found, but associated User or User ID is missing! Cannot update via webhook context.`,
            );
            return;
          }
          this.logger.log(
            `User ID associated with provider: ${provider.user.id}`,
          );

          await this.providerService.update({
            providerId: provider.id,
            userId: provider.user.id,
            updateProviderDto: {
              status: PROVIDER_STATUS.ACTIVE,
            },
          });

          this.logger.log(
            `providerService.update called successfully for provider ${provider.id}. Check ProviderService logs for details.`,
          );
        } else if (provider && provider.status === PROVIDER_STATUS.ACTIVE) {
          this.logger.log(
            `Provider ${provider.id} is already ACTIVE. No update needed.`,
          );
        } else {
          this.logger.warn(
            `Provider could not be processed for account ID ${account.id}.`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error processing account.updated for ${account.id}:`,
          error.stack ?? error.message,
        );
      }
    } else {
      this.logger.log(
        `Payouts not enabled for account ${account.id}. Status update not triggered.`,
      );
    }
  }

  async getBalance(accountId: string): Promise<Balance> {
    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: accountId,
      });

      return {
        available: (balance.available[0]?.amount || 0) / 100,
        pending: (balance.pending[0]?.amount || 0) / 100,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve balance for account ${accountId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Could not retrieve provider balance.',
      );
    }
  }

  async listPayouts(accountId: string): Promise<Payout[]> {
    try {
      const payouts = await this.stripe.payouts.list(
        {
          limit: 10,
        },
        {
          stripeAccount: accountId,
        },
      );

      return payouts.data.map(p => ({
        id: p.id,
        amount: p.amount / 100,
        arrival_date: new Date(p.arrival_date * 1000),
        status: p.status,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to list payouts for account ${accountId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Could not list provider payouts.',
      );
    }
  }

  async refundCharge(options: {
    paymentIntentId: string;
    amount?: number; // Se não fornecido, refund total (em centavos)
    reason?: string;
  }): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: options.paymentIntentId,
      };

      if (options.amount) {
        refundParams.amount = Math.round(options.amount * 100); // Converter para centavos
      }

      if (options.reason) {
        refundParams.reason = options.reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      this.logger.log(
        `Refund created: ${refund.id} for payment intent ${options.paymentIntentId}`,
      );

      return refund;
    } catch (error) {
      this.logger.error(
        `Failed to create refund for payment intent ${options.paymentIntentId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Could not process refund. Please try again later.',
      );
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(
      `Payment intent succeeded: ${paymentIntent.id}, status: ${paymentIntent.status}`,
    );

    const sessions = await this.stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
    });

    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      const chargeId = session.client_reference_id;

      if (chargeId && session.mode === 'payment') {
        this.logger.log(`Payment succeeded for charge ID: ${chargeId}.`);
        
        // Atualizar charge com paymentGatewayId e marcar como pago
        await this.chargeService.update({
          chargeId,
          updateChargeDto: {
            paymentGatewayId: paymentIntent.id,
            status: CHARGE_STATUS.PAID,
            paidAt: new Date().toISOString(),
          },
        });
        
        this.logger.log(
          `Charge ${chargeId} marked as PAID via payment_intent.succeeded with paymentGatewayId: ${paymentIntent.id}.`,
        );
      }
    } else {
      this.logger.warn(
        `No checkout session found for payment intent ${paymentIntent.id}`,
      );
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const sessions = await this.stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
    });

    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      const chargeId = session.client_reference_id;

      if (chargeId && session.mode === 'payment') {
        this.logger.warn(`Payment failed for charge ID: ${chargeId}.`);
        await this.chargeService.markAsFailed(chargeId);
      }
    }
  }

  private async handleChargeRefunded(refund: Stripe.Refund) {
    this.logger.log(
      `Refund processed: ${refund.id} for payment intent ${refund.payment_intent}`,
    );

    // Buscar charge pelo paymentGatewayId
    if (typeof refund.payment_intent === 'string') {
      const charge = await this.chargeService.findOneByPaymentGatewayId(
        refund.payment_intent,
      );

      if (charge) {
        const refundAmount = refund.amount / 100; // Converter de centavos para reais
        const currentRefundedAmount = charge.refundedAmount || 0;
        const totalRefunded = currentRefundedAmount + refundAmount;

        // Atualizar charge
        await this.chargeService.update({
          chargeId: charge.id,
          updateChargeDto: {
            refundedAmount: totalRefunded,
            status:
              totalRefunded >= charge.amount
                ? CHARGE_STATUS.REFUNDED
                : CHARGE_STATUS.PARTIALLY_REFUNDED,
          },
        });

        this.logger.log(
          `Charge ${charge.id} updated with refund. Total refunded: ${totalRefunded}`,
        );
      } else {
        this.logger.warn(
          `No charge found for payment intent ${refund.payment_intent}`,
        );
      }
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    this.logger.log(
      `Dispute created: ${dispute.id} for charge ${dispute.charge}`,
    );

    // Buscar charge pelo paymentGatewayId
    // O dispute pode ter payment_intent diretamente ou precisamos buscar a partir do charge
    let charge: Charge | null = null;
    let paymentIntentId: string | null = null;

    // Tentar obter payment_intent diretamente do dispute
    if (dispute.payment_intent) {
      paymentIntentId =
        typeof dispute.payment_intent === 'string'
          ? dispute.payment_intent
          : dispute.payment_intent.id;
    } else if (dispute.charge && typeof dispute.charge === 'string') {
      // Se não tiver payment_intent, buscar a partir do charge ID do Stripe
      try {
        const stripeCharge = await this.stripe.charges.retrieve(
          dispute.charge,
        );
        if (stripeCharge.payment_intent) {
          paymentIntentId =
            typeof stripeCharge.payment_intent === 'string'
              ? stripeCharge.payment_intent
              : stripeCharge.payment_intent.id;
        }
      } catch (error) {
        this.logger.error(
          `Failed to retrieve charge ${dispute.charge} from Stripe`,
          error,
        );
      }
    }

    // Buscar charge pelo paymentGatewayId
    if (paymentIntentId) {
      charge = await this.chargeService.findOneByPaymentGatewayId(
        paymentIntentId,
      );
    }

    if (!charge) {
      this.logger.warn(
        `No charge found for dispute ${dispute.id}. Payment intent: ${paymentIntentId}, Charge: ${dispute.charge}`,
      );
      return;
    }

    // Atualizar status do charge para IN_DISPUTE
    await this.chargeService.update({
      chargeId: charge.id,
      updateChargeDto: {
        status: CHARGE_STATUS.IN_DISPUTE,
      },
    });

    this.logger.log(`Charge ${charge.id} updated to IN_DISPUTE status.`);

    // Emitir evento de dispute criado (o listener vai cuidar da notificação)
    this.eventEmitter.emit(BillingEvents.DISPUTE_CREATED, {
      charge,
      dispute: {
        id: dispute.id,
        amount: dispute.amount / 100, // Converter de centavos para reais
        reason: dispute.reason || 'Unknown reason',
        status: dispute.status,
      },
    });
  }
}
