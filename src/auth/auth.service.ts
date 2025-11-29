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
import { OrganizationService } from 'src/organization/organization.service';
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
    private readonly organizationService: OrganizationService,
  ) {}

  async getFullUserProfile(user: User): Promise<User> {
    if (
      user.role === USER_ROLE.PROVIDER ||
      user.role === USER_ROLE.INDIVIDUAL ||
      user.role === USER_ROLE.MASTER ||
      user.role === USER_ROLE.SUB_PROVIDER
    ) {
      try {
        const userWithProfile = await this.userService.findOneByOrFail({
          id: user.id,
        });
        return userWithProfile;
      } catch (error) {
        console.error(
          'Falha ao buscar perfil de provider para usuário:',
          user.id,
          error,
        );
      }
    }
    return user;
  }

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
      user,
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
        // Criar usuário como MASTER (dono da organização)
        const newUser = await this._createUser({
          userData: createUserDto,
          role: USER_ROLE.MASTER,
          transactionalEntityManager,
        });

        const profilePayment = await this.gatewayPaymentService.createCustomer({
          email: createUserDto.email,
          name: createUserDto.title,
        });

        // Criar Organization para o MASTER
        const organization = await this.organizationService.create(
          {
            name: createUserDto.title,
            ownerId: newUser.id,
          },
          transactionalEntityManager,
        );

        // Associar o provider à organization
        const newProviderProfile = transactionalEntityManager.create(Provider, {
          title: createUserDto.title,
          bio: createUserDto.bio,
          businessPhone: createUserDto.businessPhone,
          address: createUserDto.address,
          user: newUser,
          paymentCustomerId: profilePayment.id,
          organizationId: organization.id,
        });
        await transactionalEntityManager.save(newProviderProfile);

        const jwtPayload: JwtPayload = {
          sub: newProviderProfile.user.id,
          email: newProviderProfile.user.email,
        };

        const accessToken = await this.jwtService.signAsync(jwtPayload);

        return {
          user: newUser,
          provider: newProviderProfile,
          accessToken,
        };
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

        const jwtPayload: JwtPayload = {
          sub: newClientProfile.user.id,
          email: newClientProfile.user.email,
        };

        const accessToken = await this.jwtService.signAsync(jwtPayload);

        return {
          user: newUser,
          client: newClientProfile,
          accessToken,
        };
      } catch (error) {
        throw new BadRequestException(`Client not created: ${error}`);
      }
    });
  }

  async acceptInvite({
    token,
    organizationId,
    username,
    password,
    email,
  }: {
    token: string;
    organizationId: string;
    username: string;
    password: string;
    email?: string;
  }) {
    try {
      // Verificar token JWT
      const payload: JwtPayload = await this.jwtService.verifyAsync(token);

      // Verificar que a organização existe
      const organization = await this.organizationService.findOne(
        organizationId,
      );

      // O email deve vir do token (foi definido no invite)
      const inviteEmail = payload.email || email;
      if (!inviteEmail) {
        throw new BadRequestException('Email is required');
      }

      // Verificar se o usuário já existe
      try {
        const existingUser = await this.userService.findOneByOrFail({
          email: inviteEmail,
        });
        if (existingUser.organizationId === organizationId) {
          throw new BadRequestException(
            'User is already part of this organization',
          );
        }
        throw new BadRequestException('User already exists with this email');
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        // Usuário não existe, podemos continuar
      }

      return this.dataSource.transaction(async transactionalEntityManager => {
        // Criar usuário como SUB_PROVIDER
        const hashedPassword = await this.hashService.hash(password);
        const newUser = transactionalEntityManager.create(User, {
          username,
          email: inviteEmail,
          password: hashedPassword,
          role: USER_ROLE.SUB_PROVIDER,
          organizationId: organization.id,
        });
        const savedUser = await transactionalEntityManager.save(newUser);

        // Criar perfil de provider (sem paymentCustomerId inicialmente)
        const newProviderProfile = transactionalEntityManager.create(Provider, {
          title: username, // Pode ser atualizado depois
          bio: '',
          businessPhone: '',
          address: '',
          user: savedUser,
          organizationId: organization.id,
        });
        await transactionalEntityManager.save(newProviderProfile);

        const jwtPayload: JwtPayload = {
          sub: savedUser.id,
          email: savedUser.email,
        };

        const accessToken = await this.jwtService.signAsync(jwtPayload);

        return {
          user: savedUser,
          provider: newProviderProfile,
          accessToken,
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Invalid or expired invite token: ${error}`,
      );
    }
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

      return this.dataSource.transaction(async transactionalEntityManager => {
        const user = await this.userService.findOneByOrFail({
          id: payload.sub,
        });

        const hashedPassword = await this.hashService.hash(
          setInitialPasswordDto.newPassword,
        );

        user.password = hashedPassword;

        if (setInitialPasswordDto.username !== undefined) {
          user.username = setInitialPasswordDto.username;
        }

        const updatedUser = await transactionalEntityManager.save(user);

        if (user.clientProfile) {
          const clientProfile = user.clientProfile;
          let clientUpdated = false;

          if (setInitialPasswordDto.phone !== undefined) {
            clientProfile.phone = setInitialPasswordDto.phone;
            clientUpdated = true;
          }

          if (setInitialPasswordDto.address !== undefined) {
            clientProfile.address = setInitialPasswordDto.address;
            clientUpdated = true;
          }

          if (clientUpdated) {
            await transactionalEntityManager.save(clientProfile);
          }
        }

        return updatedUser;
      });
    } catch (error) {
      throw new UnauthorizedException(`Invalid or expired token: ${error}`);
    }
  }
}
