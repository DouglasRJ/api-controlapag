export class SendPasswordSetupEmailDto {
  to: string;
  username: string;
  token: string;
  providerName?: string;
}
