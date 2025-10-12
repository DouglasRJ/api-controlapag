import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateClientDto } from 'src/client/dto/create-client.dto';
import { Client } from 'src/client/entities/client.entity';
import { GatewayPaymentService } from 'src/common/gatewayPayment/gateway-payment.service';
import { HashService } from 'src/common/hash/hash.service';
import { CreateProviderDto } from 'src/provider/dto/create-provider.dto';
import { Provider } from 'src/provider/entities/provider.entity';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { UserService } from 'src/user/user.service';
import { DataSource, EntityManager } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { SetInitialPasswordDto } from './dto/set-initial-password.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly gatewayPaymentService: GatewayPaymentService,
  ) {}

  async login({ loginDto }: { loginDto: LoginDto }) {
    const error = new UnauthorizedException('Email or Password incorrect');

    const user = await this.userService.findOneByOrFail({
      email: loginDto.email,
    });

    const isPasswordCorrect = await this.hashService.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw error;
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return {
      accessToken,
    };
  }

  private async _createUser({
    userData,
    role,
    transactionalEntityManager,
  }: {
    userData: CreateUserDto;
    role: USER_ROLE;
    transactionalEntityManager: EntityManager;
  }): Promise<User> {
    const hashedPassword = await this.hashService.hash(userData.password);
    const newUser = transactionalEntityManager.create(User, {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role,
    });

    return transactionalEntityManager.save(newUser);
  }

  async createProvider({
    createUserDto,
  }: {
    createUserDto: CreateProviderDto;
  }) {
    return this.dataSource.transaction(async transactionalEntityManager => {
      try {
        const newUser = await this._createUser({
          userData: createUserDto,
          role: USER_ROLE.PROVIDER,
          transactionalEntityManager,
        });

        const profilePayment = await this.gatewayPaymentService.createCustomer({
          email: createUserDto.email,
          name: createUserDto.title,
        });

        const newProviderProfile = transactionalEntityManager.create(Provider, {
          title: createUserDto.title,
          bio: createUserDto.bio,
          businessPhone: createUserDto.businessPhone,
          address: createUserDto.address,
          user: newUser,
          paymentCustomerId: profilePayment.id,
        });
        await transactionalEntityManager.save(newProviderProfile);

        return newProviderProfile;
      } catch (error) {
        throw new BadRequestException(`Provider not created: ${error}`);
      }
    });
  }

  async createClient({ createUserDto }: { createUserDto: CreateClientDto }) {
    return this.dataSource.transaction(async transactionalEntityManager => {
      try {
        const newUser = await this._createUser({
          userData: createUserDto,
          role: USER_ROLE.CLIENT,
          transactionalEntityManager,
        });

        const newClientProfile = transactionalEntityManager.create(Client, {
          phone: createUserDto.phone,
          address: createUserDto.address,
          user: newUser,
        });
        await transactionalEntityManager.save(newClientProfile);

        return newClientProfile;
      } catch (error) {
        throw new BadRequestException(`Client not created: ${error}`);
      }
    });
  }

  async removeUser({ userId }: { userId: string }) {
    await this.userService.remove(userId);
  }

  async setInitialPassword(
    setInitialPasswordDto: SetInitialPasswordDto,
  ): Promise<User> {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        setInitialPasswordDto.token,
      );

      const user = await this.userService.findOneByOrFail({ id: payload.sub });

      const hashedPassword = await this.hashService.hash(
        setInitialPasswordDto.newPassword,
      );

      user.password = hashedPassword;

      return this.userService.save(user);
    } catch (error) {
      throw new UnauthorizedException(`Invalid or expired token: ${error}`);
    }
  }
}
