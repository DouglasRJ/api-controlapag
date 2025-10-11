import { forwardRef, Module } from '@nestjs/common';
import { ChargeModule } from 'src/charge/charge.module';
import { ClientModule } from 'src/client/client.module';
import { CommonModule } from 'src/common/common.module';
import { EnrollmentsModule } from 'src/enrollments/enrollments.module';
import { ProviderModule } from 'src/provider/provider.module';
import { UserModule } from 'src/user/user.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => ChargeModule),
    forwardRef(() => EnrollmentsModule),
    forwardRef(() => ClientModule),
    CommonModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
