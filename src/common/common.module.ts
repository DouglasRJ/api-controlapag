import { forwardRef, Module } from '@nestjs/common';
import { ProviderModule } from 'src/provider/provider.module';
import { UserModule } from 'src/user/user.module';
import { GatewayPaymentService } from './gatewayPayment/gateway-payment.service';
import { StripeService } from './gatewayPayment/stripe.service';
import { BcryptHashService } from './hash/bcrypt-hash.service';
import { HashService } from './hash/hash.service';
import { ManageFileService } from './manageFile/manageFile.service';
import { S3Service } from './manageFile/s3-manageFile.service';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => ProviderModule)],
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
  ],
  exports: [HashService, ManageFileService, GatewayPaymentService],
})
export class CommonModule {}
