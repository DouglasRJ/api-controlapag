import { Balance, Customer, Payout } from './types/gateway.dtos';

export abstract class GatewayPaymentService {
  abstract createCustomer({
    email,
    name,
  }: {
    email: string;
    name: string;
  }): Promise<Customer>;

  abstract createSubscriptionCheckout(options: {
    customerEmail: string;
    clientReferenceId: string;
    planId: string;
  }): Promise<{ url: string }>;

  abstract createChargePaymentCheckout(options: {
    customerEmail: string;
    clientReferenceId: string;
    lineItems: any[];
    onBehalfOfAccountId: string;
    applicationFeeAmount: number;
  }): Promise<{ url: string }>;

  abstract handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }>;

  abstract createConnectedAccount(options: {
    email: string;
  }): Promise<{ id: string }>;

  abstract createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<{ url: string }>;

  abstract getBalance(accountId: string): Promise<Balance>;

  abstract listPayouts(accountId: string): Promise<Payout[]>;
}
