import { InternalServerErrorException, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientModule } from 'src/client/client.module';
import { CommonModule } from 'src/common/common.module';
import { ProviderModule } from 'src/provider/provider.module';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    CommonModule,
    UserModule,
    ProviderModule,
    ClientModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
          throw new InternalServerErrorException('JWT_SECRET not found .env');
        }

        return {
          secret,
          signOptions: { expiresIn: process.env.JWT_EXPIRATION || '1d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
