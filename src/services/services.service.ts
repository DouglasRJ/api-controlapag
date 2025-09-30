import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly userService: UserService,
  ) {}

  async findOneByOrFail(serviceData: Partial<Service>) {
    const service = await this.serviceRepository.findOne({
      where: serviceData,
      relations: ['provider'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async create(userId: string, createServiceDto: CreateServiceDto) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile) {
      throw new UnauthorizedException('User is not a Provider');
    }

    const service: Service = new Service();

    service.provider = user.providerProfile;
    service.name = createServiceDto.name;
    service.description = createServiceDto.description;
    service.defaultPrice = createServiceDto.defaultPrice;

    const created = await this.serviceRepository.save(service);
    return created;
  }

  async findAll() {
    return await this.serviceRepository.find();
  }

  async findOne(serviceId: string) {
    const service = await this.findOneByOrFail({ id: serviceId });

    if (!service) {
      throw new NotFoundException('Service not exists');
    }

    return service;
  }

  async update(
    serviceId: string,
    userId: string,
    updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.checkServiceOwnership(serviceId, userId);

    service.name = updateServiceDto.name ?? service.name;
    service.description = updateServiceDto.description ?? service.description;
    service.defaultPrice =
      updateServiceDto.defaultPrice ?? service.defaultPrice;

    const updated = await this.serviceRepository.save(service);
    return updated;
  }

  async remove(userId: string, serviceId: string) {
    const service = await this.checkServiceOwnership(serviceId, userId);
    await this.serviceRepository.remove(service);
    return service;
  }

  async checkServiceOwnership(serviceId: string, userId: string) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile) {
      throw new BadRequestException('User not have services');
    }

    const service = await this.findOneByOrFail({ id: serviceId });

    if (!service) {
      throw new NotFoundException('Service not exists');
    }

    if (service.provider.id !== user.providerProfile.id) {
      throw new UnauthorizedException(
        'User does not have permission to update this service',
      );
    }

    return service;
  }
}
