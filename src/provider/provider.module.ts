import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { PaymentModule } from 'src/payment/payment.module';
import { UserModule } from 'src/user/user.module';
import { Provider } from './entities/provider.entity';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider]),
    forwardRef(() => UserModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => CommonModule),
  ],
  controllers: [ProviderController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class ProviderModule {}
