import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import { SendEmailDto } from './dto/send-email.dto';
import { SendPasswordSetupEmailDto } from './dto/send-password-setup-email.dto';
import { EmailService } from './email.service';
import { PasswordSetupEmail } from './templates/password-setup.template';

@Injectable()
export class SesEmailService extends EmailService {
  private readonly logger = new Logger(SesEmailService.name);
  private readonly frontendBaseUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:8081',
    );
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        html: sendEmailDto.html,
        from: sendEmailDto.from,
      });
      this.logger.log(`E-mail enviado com sucesso para: ${sendEmailDto.to}`);
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail para ${sendEmailDto.to}`,
        error,
      );
    }
  }

  async sendPasswordSetupEmail(dto: SendPasswordSetupEmailDto): Promise<void> {
    const setupUrl = `${this.frontendBaseUrl}/definir-senha?token=${dto.token}`;

    const html = await render(
      PasswordSetupEmail({
        username: dto.username,
        setupUrl: setupUrl,
      }),
    );

    await this.sendEmail({
      to: dto.to,
      subject: 'Bem-vindo ao ControlaPAG! Defina sua senha.',
      html: html,
    });
  }
}
