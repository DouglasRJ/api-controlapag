import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChargeService } from 'src/charge/charge.service';
import { ClientService } from 'src/client/client.service';
import { GatewayPaymentService } from 'src/common/gatewayPayment/gateway-payment.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { ProviderService } from 'src/provider/provider.service';
import { User } from 'src/user/entities/user.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private ID_PLAN: string;
  private PLATFORM_FEE_PERCENTAGE: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly gatewayPayment: GatewayPaymentService,
    private readonly chargeService: ChargeService,
    private readonly providerService: ProviderService,
    private readonly clientService: ClientService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {
    const planId = this.configService.get<string>('STRIPE_ID_PLAN');
    if (!planId) {
      throw new InternalServerErrorException(
        'Stripe Plan ID for subscription is not configured.',
      );
    }
    this.ID_PLAN = planId;

    const configPlatformFee = this.configService.get<number>(
      'PLATFORM_FEE_PERCENTAGE',
    );
    if (!configPlatformFee) {
      throw new InternalServerErrorException(
        'Platform FEE Percentage for subscription is not configured.',
      );
    }
    this.PLATFORM_FEE_PERCENTAGE = configPlatformFee;
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

    return this.gatewayPayment.createSubscriptionCheckout({
      customerEmail: user.email,
      clientReferenceId: user.id,
      planId: this.ID_PLAN,
    });
  }

  async createClientChargePayment(chargeId: string, user: User) {
    const charge = await this.chargeService.findOneByOrFail(
      { id: chargeId },
      true,
    );

    const enrollment = await this.enrollmentsService.findOneByOrFail({
      id: charge.enrollment.id,
    });

    const provider = await this.providerService.findOneByOrFail({
      id: enrollment.service.provider.id,
    });

    if (
      !provider.providerPaymentId ||
      provider.providerPaymentId.trim() === ''
    ) {
      this.logger.error(
        `Provider (ID: ${provider.id}) não possui um providerPaymentId (Stripe Account ID) configurado para receber pagamentos.`,
      );

      throw new BadRequestException(
        'O prestador deste serviço não está configurado para receber pagamentos no momento.',
      );
    }

    const applicationFee = Math.round(
      charge.amount * 100 * this.PLATFORM_FEE_PERCENTAGE,
    );

    return this.gatewayPayment.createChargePaymentCheckout({
      customerEmail: user.email,
      clientReferenceId: charge.id,
      lineItems: [
        {
          price_data: {
            currency: 'brl',
            product_data: { name: `Pagamento para ${provider.title}` },
            unit_amount: Math.round(charge.amount * 100),
          },
          quantity: 1,
        },
      ],

      onBehalfOfAccountId: provider.providerPaymentId,
      applicationFeeAmount: applicationFee,
    });
  }

  handleStripeWebhook(payload: Buffer, signature: string) {
    return this.gatewayPayment.handleWebhook(payload, signature);
  }

  handleStripePlatformWebhook(payload: Buffer, signature: string) {
    return this.gatewayPayment.handlePlatformWebhook(payload, signature);
  }
}
