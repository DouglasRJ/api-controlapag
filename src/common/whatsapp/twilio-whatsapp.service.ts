import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { SendWhatsappPasswordSetupDto } from './dto/send-whatsapp-password-setup.dto';
import { SendWhatsappTemplateDto } from './dto/send-whatsapp-template.dto';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class TwilioWhatsappService extends WhatsappService {
  private readonly logger = new Logger(TwilioWhatsappService.name);
  private readonly twilioClient: Twilio;
  private readonly twilioWhatsappFrom: string;
  private readonly frontendBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    super();

    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');
    this.twilioWhatsappFrom = this.configService.get<string>(
      'TWILIO_WHATSAPP_FROM',
      '',
    );
    this.frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:8081',
    );

    if (!accountSid || !authToken) {
      this.logger.warn(
        'Credenciais do Twilio não configuradas. WhatsApp não funcionará.',
      );
    }

    if (!this.twilioWhatsappFrom) {
      this.logger.warn(
        'TWILIO_WHATSAPP_FROM não configurado. Use whatsapp:+14155238886 para sandbox ou seu número aprovado.',
      );
    }

    this.twilioClient = new Twilio(accountSid, authToken);

    this.logger.log('TwilioWhatsappService inicializado');
    this.logger.log(
      `Número FROM configurado: ${this.twilioWhatsappFrom || 'NÃO CONFIGURADO'}`,
    );
  }

  private formatPhoneNumber(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }

    if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
      cleanPhone = '55' + cleanPhone;
    }

    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }

    return cleanPhone;
  }

  private async sendTemplateMessage(
    dto: SendWhatsappTemplateDto,
  ): Promise<void> {
    try {
      const formattedPhone = this.formatPhoneNumber(dto.to);
      this.logger.debug(
        `Enviando WhatsApp para: ${formattedPhone} (original: ${dto.to})`,
      );

      const message = await this.twilioClient.messages.create({
        from: this.twilioWhatsappFrom,
        to: `whatsapp:${formattedPhone}`,
        contentSid: dto.templateSid,
        contentVariables: JSON.stringify(dto.contentVariables),
      });

      this.logger.log(
        `WhatsApp enviado com sucesso para: ${formattedPhone}. SID: ${message.sid}`,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao enviar WhatsApp para ${dto.to}. From: ${this.twilioWhatsappFrom}`,
        error,
      );
      throw error;
    }
  }

  async sendPasswordSetupWhatsApp(
    dto: SendWhatsappPasswordSetupDto,
  ): Promise<void> {
    const setupUrl = `${this.frontendBaseUrl}/client-onboarding?token=${dto.token}`;
    const formattedPhone = this.formatPhoneNumber(dto.to);

    this.logger.debug(
      `Preparando envio de setup de senha via WhatsApp para: ${formattedPhone} (original: ${dto.to})`,
    );
    this.logger.debug(`From configurado: ${this.twilioWhatsappFrom}`);

    try {
      const templateSid = this.configService.get<string>(
        'TWILIO_PASSWORD_SETUP_TEMPLATE_SID',
      );

      if (templateSid) {
        await this.sendTemplateMessage({
          to: dto.to,
          templateSid: templateSid,
          contentVariables: {
            1: dto.username || 'Usuário',
            2: setupUrl,
          },
        });
      } else {
        const message = await this.twilioClient.messages.create({
          from: this.twilioWhatsappFrom,
          to: `whatsapp:${formattedPhone}`,
          body: `Olá ${dto.username || ''}!\n\nBem-vindo ao ControlaPAG! 🎉\n\nSua conta foi criada e você precisa definir sua senha de acesso.\n\nClique no link abaixo para criar sua senha:\n${setupUrl}\n\nEste link é válido por 24 horas.\n\nSe você não esperava esta mensagem, ignore-a.`,
        });

        this.logger.log(
          `WhatsApp de setup de senha enviado para: ${formattedPhone}. SID: ${message.sid}`,
        );
      }
    } catch (error) {
      const errorCode = error?.code;

      if (errorCode === 63007) {
        this.logger.error(
          `❌ ERRO TWILIO 63007: O número FROM '${this.twilioWhatsappFrom}' não está configurado/ativado no Twilio para WhatsApp.`,
        );
        this.logger.error(
          `📌 SOLUÇÃO PARA DESENVOLVIMENTO: Use o sandbox do Twilio:`,
        );
        this.logger.error(
          `   1. Configure TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`,
        );
        this.logger.error(
          `   2. Conecte o número de destino enviando 'join <código>' para +1 415 523 8886`,
        );
        this.logger.error(
          `   3. Documentação: https://www.twilio.com/docs/whatsapp/sandbox`,
        );
        this.logger.error(
          `📌 SOLUÇÃO PARA PRODUÇÃO: Obtenha um número aprovado do Twilio com WhatsApp habilitado.`,
        );
      } else {
        this.logger.error(
          `Falha ao enviar WhatsApp de setup para ${dto.to}. From: ${this.twilioWhatsappFrom}`,
          error,
        );
      }

      throw error;
    }
  }
}
