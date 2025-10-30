import { Injectable, Logger } from '@nestjs/common';
import { SendWhatsappPasswordSetupDto } from './dto/send-whatsapp-password-setup.dto';
import { SendWhatsappTemplateDto } from './dto/send-whatsapp-template.dto';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class MockWhatsappService extends WhatsappService {
  private readonly logger = new Logger(MockWhatsappService.name);

  async sendTemplateMessage(dto: SendWhatsappTemplateDto): Promise<void> {
    this.logger.warn(
      `[Simulação] Envio de WhatsApp (Template ${dto.templateSid}) para ${dto.to}. Variáveis: ${JSON.stringify(dto.contentVariables)}`,
    );
    return Promise.resolve();
  }

  async sendPasswordSetupWhatsApp(
    dto: SendWhatsappPasswordSetupDto,
  ): Promise<void> {
    this.logger.warn(
      `[Simulação] Envio de WhatsApp (Setup de Senha) para ${dto.phone} com token: ${dto.token.substring(0, 10)}...`,
    );
    return Promise.resolve();
  }
}
