export class SendEmailDto {
  to: string;
  subject: string;
  html: string;
  from?: string;
}
