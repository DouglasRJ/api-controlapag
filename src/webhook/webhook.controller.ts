import {
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import { type Request } from 'express';
import { PaymentService } from 'src/payment/payment.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe')
  handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing Stripe signature.');
    }
    if (!req.rawBody) {
      throw new UnauthorizedException('Missing request body.');
    }

    return this.paymentService.handleStripeWebhook(req.rawBody, signature);
  }
}
