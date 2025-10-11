import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PROVIDER_STATUS } from 'src/provider/enum/provider-status.enum';
import { ProviderService } from 'src/provider/provider.service';
import { UserService } from 'src/user/user.service';
import Stripe from 'stripe';
import { GatewayPaymentService } from './gateway-payment.service';

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

  async generateCheckout({
    email,
    userId,
    paymentMethodTypes,
    mode,
    idPlan,
  }: {
    email: string;
    userId: string;
    paymentMethodTypes: Array<'card'>;
    mode: 'subscription';
    idPlan: string;
  }) {
    try {
      const customer = await this.createCustomer({
        email,
      });

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        mode: mode,
        client_reference_id: userId,
        customer: customer.id,
        success_url: `http://localhost:8080/done`,
        cancel_url: `http://localhost:8080/error`,
        line_items: [
          {
            price: idPlan,
            quantity: 1,
          },
        ],
      });

      if (!session.url) {
        throw new BadRequestException('Checkout not created');
      }

      return {
        url: session.url,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async handleCheckoutSessionCompleted(event: {
    data: { object: Stripe.Checkout.Session };
  }) {
    const { object: data } = event.data;
    const userId = data.client_reference_id;
    const stripeSubscriptionId = data.subscription as string;
    const stripeCustomerId = data.customer as string;
    const checkoutStatus = data.status;

    if (checkoutStatus !== 'complete') return;

    if (!userId || !stripeSubscriptionId || !stripeCustomerId) {
      throw new BadRequestException(
        'UserId, stripeSubscriptionId, stripeCustomerId is required',
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

      default:
        this.logger.warn(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}
