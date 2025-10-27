import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChargeExceptionModule } from './charge-exception/charge-exception.module';
import { ChargeScheduleModule } from './charge-schedule/charge-schedule.module';
import { ChargeModule } from './charge/charge.module';
import { ClientModule } from './client/client.module';
import { CronModule } from './cron/cron.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { PaymentModule } from './payment/payment.module';
import { ProviderModule } from './provider/provider.module';
import { ServiceScheduleModule } from './service-schedule/service-schedule.module';
import { ServicesModule } from './services/services.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 10,
          blockDuration: 5000,
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: process.env.DB_AUTO_LOAD_ENTITIES === '1',
      synchronize: false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    UserModule,
    AuthModule,
    ProviderModule,
    ClientModule,
    ServicesModule,
    EnrollmentsModule,
    ChargeScheduleModule,
    ChargeExceptionModule,
    ChargeModule,
    CronModule,
    PaymentModule,
    WebhookModule,
    DashboardModule,
    ServiceScheduleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
