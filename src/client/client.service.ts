import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { UserService } from 'src/user/user.service';
import { DataSource, FindOptionsWhere, Like, Repository } from 'typeorm';
import { CreateClientByProviderDto } from './dto/create-client-by-provider.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async findOneByOrFail(
    clientData: FindOptionsWhere<Client>,
    getEnrollments = false,
  ) {
    const user = await this.clientRepository.findOne({
      where: clientData,
      relations: ['user', ...(getEnrollments ? ['enrollments'] : [])],
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    return user;
  }

  async create({
    userId,
    createClientDto,
  }: {
    userId: string;
    createClientDto: CreateClientDto;
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    const client: Client = new Client();

    client.address = createClientDto.address;
    client.phone = createClientDto.phone;
    client.user = user;

    const created = await this.clientRepository.save(client);
    return created;
  }

  findAll(search: string) {
    const searchTerm = search || '';
    return this.clientRepository.find({
      where: {
        user: { username: Like(`%${searchTerm}%`) },
      },
      relations: ['user'],
      take: 10,
    });
  }

  async findOne({ userId }: { userId: string }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.clientProfile) {
      throw new BadRequestException('User not have Client Profile');
    }

    const client = await this.findOneByOrFail(
      { id: user.clientProfile.id },
      true,
    );

    return client;
  }

  async update({
    clientId,
    userId,
    updateClientDto,
  }: {
    clientId: string;
    userId: string;
    updateClientDto: UpdateClientDto;
  }) {
    const client = await this.checkClientOwnership({ clientId, userId });

    client.address = updateClientDto.address ?? client.address;
    client.phone = updateClientDto.phone ?? client.phone;

    const updated = await this.clientRepository.save(client);
    return updated;
  }

  async remove({ clientId, userId }: { clientId: string; userId: string }) {
    const client = await this.checkClientOwnership({ clientId, userId });
    await this.clientRepository.remove(client);
    return client;
  }

  async checkClientOwnership({
    clientId,
    userId,
  }: {
    clientId: string;
    userId: string;
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.clientProfile || user.clientProfile.id !== clientId) {
      throw new UnauthorizedException('Not your client profile');
    }

    const client = await this.findOneByOrFail({ id: clientId });

    return client;
  }

  async countTotalClientsForProvider(providerId: string): Promise<number> {
    return this.clientRepository
      .createQueryBuilder('client')
      .innerJoin('client.enrollments', 'enrollment')
      .innerJoin('enrollment.service', 'service')
      .where('service.providerId = :providerId', { providerId })
      .getCount();
  }

  async countNewClientsForProviderInDateRange(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.clientRepository
      .createQueryBuilder('client')
      .innerJoin('client.enrollments', 'enrollment')
      .innerJoin('enrollment.service', 'service')
      .where('service.providerId = :providerId', { providerId })
      .andWhere('client.createdAt >= :startDate', { startDate })
      .andWhere('client.createdAt <= :endDate', { endDate })
      .getCount();
  }

  async createClientByProvider({
    providerUserId,
    createClientDto,
  }: {
    providerUserId: string;
    createClientDto: CreateClientByProviderDto;
  }) {
    const providerUser = await this.userService.findOneByOrFail({
      id: providerUserId,
    });
    if (!providerUser.providerProfile) {
      throw new UnauthorizedException('Only providers can register clients.');
    }

    const tempPassword = randomBytes(16).toString('hex');

    const newClientProfile = await this.dataSource.transaction(
      async transactionalEntityManager => {
        const userToCreate: CreateUserDto = {
          username: createClientDto.username,
          email: createClientDto.email,
          password: tempPassword,
          role: USER_ROLE.CLIENT,
        };

        const newUser = await this.userService.create(
          userToCreate,
          transactionalEntityManager,
        );

        const newClientProfile = transactionalEntityManager.create(Client, {
          phone: createClientDto.phone,
          address: createClientDto.address,
          user: newUser,
        });

        return transactionalEntityManager.save(newClientProfile);
      },
    );

    const jwtPayload: JwtPayload = {
      sub: newClientProfile.user.id,
      email: newClientProfile.user.email,
    };

    const passwordSetupToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: '24h',
    });

    return {
      client: newClientProfile,
      passwordSetupToken,
    };
  }
}
