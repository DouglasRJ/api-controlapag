import { Injectable } from '@nestjs/common';
import { SendWhatsappPasswordSetupDto } from './dto/send-whatsapp-password-setup.dto';
import { SendWhatsappTemplateDto } from './dto/send-whatsapp-template.dto';

@Injectable()
export abstract class WhatsappService {
  abstract sendTemplateMessage(
    sendWhatsappTemplateDto: SendWhatsappTemplateDto,
  ): Promise<void>;

  abstract sendPasswordSetupWhatsApp(
    sendWhatsappPasswordSetupDto: SendWhatsappPasswordSetupDto,
  ): Promise<void>;
}
