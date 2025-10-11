import { Charge } from 'src/charge/entities/charge.entity';

export interface Customer {
  id: string;
}

export interface CreateSubscriptionDto {
  gatewayCustomerId: string;
  priceId: string;
}

export interface CreateOneTimePaymentDto {
  gatewayCustomerId: string;
  charge: Charge;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  clientSecret: string;
}

export interface CreateOneTimePaymentResult {
  paymentIntentId: string;
  clientSecret: string;
}

export interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}
