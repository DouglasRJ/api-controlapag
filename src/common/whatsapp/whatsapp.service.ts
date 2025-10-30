import { Injectable } from '@nestjs/common';
import { SendWhatsappPasswordSetupDto } from './dto/send-whatsapp-password-setup.dto';

@Injectable()
export abstract class WhatsappService {
  abstract sendPasswordSetupWhatsApp(
    sendWhatsappPasswordSetupDto: SendWhatsappPasswordSetupDto,
  ): Promise<void>;
}
