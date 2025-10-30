import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createTransport, SentMessageInfo, Transporter } from 'nodemailer';
import { EmailService } from './email.service';
import { SesEmailService } from './ses-email.service';

interface CustomTransportOptions {
  sesClient: SESClient;
  name?: string;
  version?: string;
}

interface MailMessage {
  message: {
    build: (callback: (err: Error | null, message: Buffer) => void) => void;
    getEnvelope: () => { from: string; to: string[] };
  };
  data: {
    from?: string;
    to?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
  };
}

class SESv3Transport {
  name: string;
  version: string;
  private sesClient: SESClient;

  constructor(options: CustomTransportOptions) {
    this.sesClient = options.sesClient;
    this.name = options.name || 'SESv3';
    this.version = options.version || '1.0.0';
  }

  send(
    mail: MailMessage,
    callback: (err: Error | null, info?: SentMessageInfo) => void,
  ): void {
    mail.message.build((err: Error | null, message: Buffer) => {
      if (err) {
        callback(err);
        return;
      }

      const command = new SendRawEmailCommand({
        RawMessage: {
          Data: message,
        },
      });

      this.sesClient
        .send(command)
        .then(result => {
          const envelope = mail.message.getEnvelope();
          callback(null, {
            envelope,
            messageId: result.MessageId || 'unknown',
            accepted: envelope.to || [],
            rejected: [],
            pending: [],
            response: 'OK',
          });
        })
        .catch(error =>
          callback(error instanceof Error ? error : new Error(String(error))),
        );
    });
  }
}

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const region = configService.get<string>('S3_REGION', 'sa-east-1');

        const sesClient = new SESClient({
          region,
          credentials: defaultProvider(),
        });

        const sesTransport = new SESv3Transport({ sesClient });
        const transport: Transporter = createTransport(sesTransport);

        return {
          transport,
          defaults: {
            from: configService.get<string>('DEFAULT_FROM_EMAIL'),
          },
        };
      },
    }),
  ],
  providers: [
    SesEmailService,
    {
      provide: EmailService,
      useClass: SesEmailService,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
