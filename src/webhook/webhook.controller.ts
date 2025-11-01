import {
  Controller,
  Headers,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import { type Request } from 'express';
import { PaymentService } from 'src/payment/payment.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe')
  handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    this.logger.log(
      `Received webhook at /webhook/stripe (CONNECT). Signature present: ${!!signature}`,
    );

    if (!signature) {
      throw new UnauthorizedException('Missing Stripe signature.');
    }
    if (!req.rawBody) {
      throw new UnauthorizedException('Missing request body.');
    }

    return this.paymentService.handleStripeWebhook(req.rawBody, signature);
  }

  @Post('stripe-platform')
  handleStripePlatformWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    this.logger.log(
      `Received webhook at /webhook/stripe-platform (PLATFORM). Signature present: ${!!signature}`,
    );

    if (!signature) {
      throw new UnauthorizedException('Missing Stripe signature.');
    }
    if (!req.rawBody) {
      throw new UnauthorizedException('Missing request body.');
    }

    return this.paymentService.handleStripePlatformWebhook(
      req.rawBody,
      signature,
    );
  }
}
