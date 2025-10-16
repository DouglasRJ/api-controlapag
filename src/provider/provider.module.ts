import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { PaymentModule } from 'src/payment/payment.module';
import { ServicesModule } from 'src/services/services.module';
import { UserModule } from 'src/user/user.module';
import { Provider } from './entities/provider.entity';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider]),
    forwardRef(() => UserModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => ServicesModule),
    forwardRef(() => EnrollmentsModule),
    forwardRef(() => CommonModule),
  ],
  controllers: [ProviderController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class ProviderModule {}
