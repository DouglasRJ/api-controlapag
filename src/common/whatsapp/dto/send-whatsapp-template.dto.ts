export class SendWhatsappTemplateDto {
  to: string;
  templateSid: string;
  contentVariables: Record<string, string>;
}
