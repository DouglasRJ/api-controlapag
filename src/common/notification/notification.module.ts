import { Module } from '@nestjs/common';
import { ChargeModule } from 'src/charge/charge.module';
import { EmailModule } from 'src/common/email/ses-email.module';
import { WhatsappService } from 'src/common/whatsapp/whatsapp.service';
import { TwilioWhatsappService } from 'src/common/whatsapp/twilio-whatsapp.service';
import { OrganizationModule } from 'src/organization/organization.module';
import { UserModule } from 'src/user/user.module';
import { BillingNotificationListener } from './billing-notification.listener';

@Module({
  imports: [
    ChargeModule,
    EmailModule,
    OrganizationModule,
    UserModule,
  ],
  providers: [
    BillingNotificationListener,
    {
      provide: WhatsappService,
      useClass: TwilioWhatsappService,
    },
  ],
})
export class NotificationModule {}

