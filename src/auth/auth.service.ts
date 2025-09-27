import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashService } from 'src/common/hash/hash.service';
import { CreateProviderDto } from 'src/provider/dto/create-provider.dto';
import { Provider } from 'src/provider/entities/provider.entity';
import { User } from 'src/user/entities/user.entity';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { UserService } from 'src/user/user.service';
import { DataSource, EntityManager } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

type UserData = {
  username: string;
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async login(loginDto: LoginDto) {
    const error = new UnauthorizedException('Email or Password incorrect');

    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw error;
    }

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

  private async _createUser(
    userData: UserData,
    role: USER_ROLE,
    transactionalEntityManager: EntityManager,
  ): Promise<User> {
    const hashedPassword = await this.hashService.hash(userData.password);
    const newUser = transactionalEntityManager.create(User, {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role,
    });

    return transactionalEntityManager.save(newUser);
  }

  async createProvider(createUserDto: CreateProviderDto) {
    return this.dataSource.transaction(async transactionalEntityManager => {
      try {
        const newUser = await this._createUser(
          createUserDto,
          USER_ROLE.PROVIDER,
          transactionalEntityManager,
        );

        const newProviderProfile = transactionalEntityManager.create(Provider, {
          title: createUserDto.title,
          bio: createUserDto.bio,
          businessPhone: createUserDto.businessPhone,
          address: createUserDto.address,
          user: newUser,
        });
        await transactionalEntityManager.save(newProviderProfile);

        return newProviderProfile;
      } catch (error) {
        throw new BadRequestException(`Provider not created: ${error}`);
      }
    });
  }

  async removeUser(userId: string) {
    await this.userService.remove(userId);
  }
}
