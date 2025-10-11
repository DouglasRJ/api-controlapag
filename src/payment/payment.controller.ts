import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('subscription/provider')
  createSubscription(
    @Req() req: AuthenticatedRequest,
    @Body() createSubscriptionDTO: CreateSubscriptionDto,
  ) {
    return this.paymentService.createProviderSubscription({
      createSubscriptionDTO,
      user: req.user,
    });
  }

  // @UseGuards(AuthGuard('jwt'))
  // @Post('charge/:chargeId')
  // createChargePayment(
  //   @Param('chargeId') chargeId: string,
  //   @Req() req: AuthenticatedRequest,
  // ) {
  //   return this.paymentService.createClientChargePayment(chargeId, req.user);
  // }

  // @Post('webhook')
  // async handleWebhook(
  //   @Headers('stripe-signature') signature: string,
  //   @Req() req: RawBodyRequest<Request>,
  // ) {
  //   if (!signature) {
  //     throw new UnauthorizedException('Missing Stripe signature.');
  //   }
  //   return this.paymentService.handleWebhook(req.rawBody, signature);
  // }
}
