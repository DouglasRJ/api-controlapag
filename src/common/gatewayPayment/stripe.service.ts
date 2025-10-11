import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChargeService } from 'src/charge/charge.service';
import { PROVIDER_STATUS } from 'src/provider/enum/provider-status.enum';
import { ProviderService } from 'src/provider/provider.service';
import { UserService } from 'src/user/user.service';
import Stripe from 'stripe';
import { GatewayPaymentService } from './gateway-payment.service';
import { Balance, Payout } from './types/gateway.dtos';

@Injectable()
export class StripeService implements GatewayPaymentService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    @Inject(forwardRef(() => ChargeService))
    private readonly chargeService: ChargeService,
  ) {
    const configStripeApiKey = this.configService.get<string>('STRIPE_API_KEY');
    if (!configStripeApiKey) {
      throw new InternalServerErrorException('Stripe API Key not configured.');
    }
    this.stripe = new Stripe(configStripeApiKey, {
      httpClient: Stripe.createFetchHttpClient(),
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
      success_url: `http://localhost:8080/subscription/success`,
      cancel_url: `http://localhost:8080/subscription/error`,
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
  }): Promise<{ url: string }> {
    const customer = await this.createCustomer({
      email: options.customerEmail,
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      mode: 'payment',
      client_reference_id: options.clientReferenceId,
      customer: customer.id,
      success_url: `http://localhost:8080/payment/success`,
      cancel_url: `http://localhost:8080/payment/error`,
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
    return { url: session.url };
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

      await this.chargeService.markAsPaid(chargeId, new Date());

      this.logger.log(`Charge ${chargeId} marked as PAID.`);
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

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed.`, err);
      throw new BadRequestException(`Webhook error: ${err}`);
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionSessionCompleted(event);
        break;
      case 'customer.subscription.deleted':
        await this.handleCancelPlan(event);
        break;

      case 'account.updated':
        await this.handleAccountUpdated(event.data.object);
        break;

      default:
        this.logger.warn(`Unhandled event type ${event.type}`);
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
    if (account.payouts_enabled) {
      const provider = await this.providerService.findOneByOrFail({
        providerPaymentId: account.id,
      });

      if (provider && provider.status !== PROVIDER_STATUS.ACTIVE) {
        this.logger.log(
          `Provider account ${account.id} is now enabled for payouts. Updating status to ACTIVE.`,
        );
        await this.providerService.update({
          providerId: provider.id,
          userId: provider.user.id,
          updateProviderDto: {
            status: PROVIDER_STATUS.ACTIVE,
          },
        });
      }
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
}
