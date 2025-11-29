import { forwardRef, Module } from '@nestjs/common';
import { ChargeModule } from 'src/charge/charge.module';
import { OrganizationModule } from 'src/organization/organization.module';
import { ProviderModule } from 'src/provider/provider.module';
import { UserModule } from 'src/user/user.module';
import { EmailModule } from './email/ses-email.module';
import { GatewayPaymentService } from './gatewayPayment/gateway-payment.service';
import { StripeService } from './gatewayPayment/stripe.service';
import { BcryptHashService } from './hash/bcrypt-hash.service';
import { HashService } from './hash/hash.service';
import { ManageFileService } from './manageFile/manageFile.service';
import { S3Service } from './manageFile/s3-manageFile.service';
import { TwilioWhatsappService } from './whatsapp/twilio-whatsapp.service';
import { WhatsappService } from './whatsapp/whatsapp.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => ChargeModule),
    forwardRef(() => OrganizationModule),
    EmailModule,
  ],
  providers: [
    {
      provide: HashService,
      useClass: BcryptHashService,
    },
    {
      provide: ManageFileService,
      useClass: S3Service,
    },
    {
      provide: GatewayPaymentService,
      useClass: StripeService,
    },
    {
      provide: WhatsappService,
      useClass: TwilioWhatsappService,
    },
  ],
  exports: [
    HashService,
    ManageFileService,
    GatewayPaymentService,
    EmailModule,
    WhatsappService,
  ],
})
export class CommonModule {}
