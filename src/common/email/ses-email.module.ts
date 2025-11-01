import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SentMessageInfo } from 'nodemailer';
import { EmailService } from './email.service';
import { SesEmailService } from './ses-email.service';

function createSESTransport(sesClient: SESClient) {
  return {
    name: 'SESv3',
    version: '1.0.0',
    send: function (
      mail: any,
      callback: (err: Error | null, info?: SentMessageInfo) => void,
    ) {
      mail.message.build((err: Error | null, message: Buffer) => {
        if (err) {
          return callback(err);
        }

        const command = new SendRawEmailCommand({
          RawMessage: {
            Data: message,
          },
        });

        sesClient
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
          .catch(error => {
            callback(error instanceof Error ? error : new Error(String(error)));
          });
      });
    },
  };
}

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const region = 'us-east-1';

        const sesClient = new SESClient({
          region,
          credentials: defaultProvider(),
        });

        const transport = createSESTransport(sesClient);

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
