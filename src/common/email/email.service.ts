import { Injectable } from '@nestjs/common';
import { SendEmailDto } from './dto/send-email.dto';
import { SendPasswordSetupEmailDto } from './dto/send-password-setup-email.dto';

@Injectable()
export abstract class EmailService {
  abstract sendEmail(sendEmailDto: SendEmailDto): Promise<void>;
  abstract sendPasswordSetupEmail(
    sendPasswordSetupEmailDto: SendPasswordSetupEmailDto,
  ): Promise<void>;
}
