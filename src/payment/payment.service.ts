import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChargeService } from 'src/charge/charge.service';
import { ClientService } from 'src/client/client.service';
import { GatewayPaymentService } from 'src/common/gatewayPayment/gateway-payment.service';
import { ProviderService } from 'src/provider/provider.service';
import { User } from 'src/user/entities/user.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private ID_PLAN: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly gatewayPayment: GatewayPaymentService,
    private readonly chargeService: ChargeService,
    private readonly providerService: ProviderService,
    private readonly clientService: ClientService,
  ) {
    const planId = this.configService.get<string>('STRIPE_ID_PLAN');
    if (!planId) {
      throw new InternalServerErrorException(
        'Stripe Plan ID for subscription is not configured.',
      );
    }
    this.ID_PLAN = planId;
  }

  async createProviderSubscription({
    createSubscriptionDTO,
    user,
  }: {
    createSubscriptionDTO: CreateSubscriptionDto;
    user: User;
  }) {
    let provider = await this.providerService.findOneByOrFail({
      id: createSubscriptionDTO.providerId,
    });

    if (provider.user.id !== user.id) {
      throw new UnauthorizedException(
        'Provider does not belong to the authenticated user.',
      );
    }

    if (!provider.paymentCustomerId) {
      const customer = await this.gatewayPayment.createCustomer({
        email: user.email,
        name: user.username,
      });

      const newPaymentCustomerId = {
        paymentCustomerId: customer.id,
      };

      provider = await this.providerService.update({
        providerId: provider.id,
        userId: user.id,
        updateProviderDto: newPaymentCustomerId,
      });
    }

    const urlCheckout = await this.gatewayPayment.generateCheckout({
      email: user.email,
      userId: user.id,
      paymentMethodTypes: ['card'],
      mode: 'subscription',
      idPlan: this.ID_PLAN,
    });

    return urlCheckout;
  }

  handleStripeWebhook(payload: Buffer, signature: string) {
    return this.gatewayPayment.handleWebhook(payload, signature);
  }
}
