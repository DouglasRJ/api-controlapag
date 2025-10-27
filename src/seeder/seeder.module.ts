import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { AuthModule } from '../auth/auth.module';
import { ChargeExceptionModule } from '../charge-exception/charge-exception.module';
import { ChargeException } from '../charge-exception/entities/charge-exception.entity';
import { ChargeSchedule } from '../charge-schedule/entities/charge-schedule.entity';
import { ClientModule } from '../client/client.module';
import { Client } from '../client/entities/client.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { Enrollments } from '../enrollments/entities/enrollment.entity';
import { Provider } from '../provider/entities/provider.entity';
import { ProviderModule } from '../provider/provider.module';
import { ServiceSchedule } from '../service-schedule/entities/service-schedule.entity';
import { Service } from '../services/entities/service.entity';
import { ServicesModule } from '../services/services.module';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { SeederService } from './seeder.service';

@Module({
  imports: [
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
      autoLoadEntities: true,
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([
      User,
      Provider,
      Client,
      Service,
      Enrollments,
      ChargeSchedule,
      ServiceSchedule,
      ChargeException,
    ]),
    CommonModule,
    AuthModule,
    UserModule,
    ProviderModule,
    ClientModule,
    ServicesModule,
    EnrollmentsModule,
    ChargeExceptionModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
