import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly userService: UserService,
  ) {}

  async findOneByOrFail(clientData: Partial<Client>) {
    const user = await this.clientRepository.findOne({
      where: clientData,
      relations: ['user'],
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    return user;
  }

  async create(userId: string, createClientDto: CreateClientDto) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    const client: Client = new Client();

    client.address = createClientDto.address;
    client.phone = createClientDto.phone;
    client.user = user;

    const created = await this.clientRepository.save(client);
    return created;
  }

  findAll() {
    return this.clientRepository.find();
  }

  async findOne(userId: string) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.clientProfile) {
      throw new BadRequestException('User not have Client Profile');
    }

    return user.clientProfile;
  }

  async update(
    clientId: string,
    userId: string,
    updateClientDto: UpdateClientDto,
  ) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.clientProfile || user.clientProfile.id !== clientId) {
      throw new UnauthorizedException('Not your client profile');
    }

    const client = await this.findOneByOrFail({ id: clientId });

    client.address = updateClientDto.address ?? client.address;
    client.phone = updateClientDto.phone ?? client.phone;

    const updated = await this.clientRepository.save(client);
    return updated;
  }

  remove(id: number) {
    return `This action removes a #${id} client`;
  }
}
