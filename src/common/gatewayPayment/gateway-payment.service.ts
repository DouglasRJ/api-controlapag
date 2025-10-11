import { Customer } from './types/gateway.dtos';

export abstract class GatewayPaymentService {
  abstract createCustomer({
    email,
    name,
  }: {
    email: string;
    name: string;
  }): Promise<Customer>;

  abstract generateCheckout({
    email,
    userId,
    paymentMethodTypes,
    mode,
    idPlan,
  }: {
    email: string;
    userId: string;
    paymentMethodTypes: Array<'card' | 'pix'>;
    mode: 'subscription';
    idPlan: string;
  }): Promise<{ url: string }>;

  abstract handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }>;
}
