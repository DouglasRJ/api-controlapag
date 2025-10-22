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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { allowedPaymentMethods, ...findCriteria } = serviceData;

    const service = await this.serviceRepository.findOne({
      where: findCriteria,
      relations: [
        'provider',
        'enrollments',
        'enrollments.client',
        'enrollments.client.user',
      ],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findAllByProvider({
    providerId,
    query,
    isActive,
  }: {
    providerId: string;
    query?: string;
    isActive?: boolean;
  }) {
    if (!providerId) {
      throw new BadRequestException('Provider Id is missing');
    }

    const qb = this.serviceRepository.createQueryBuilder('service');
    qb.where('service.providerId = :providerId', { providerId });

    if (isActive !== undefined) {
      qb.andWhere('service.isActive = :isActive', { isActive });
    }

    if (query) {
      const searchPattern = `%${query}%`;
      qb.andWhere(
        '(service.name ILIKE :searchPattern OR service.description ILIKE :searchPattern)',
        { searchPattern },
      );
    }

    qb.leftJoinAndSelect('service.provider', 'provider');
    qb.leftJoinAndSelect('service.enrollments', 'enrollments');
    qb.leftJoinAndSelect('enrollments.client', 'client');

    const services = await qb.getMany();

    return services;
  }

  async create({
    userId,
    createServiceDto,
  }: {
    userId: string;
    createServiceDto: CreateServiceDto;
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile) {
      throw new UnauthorizedException('User is not a Provider');
    }

    const service: Service = new Service();

    service.provider = user.providerProfile;
    service.name = createServiceDto.name;
    service.description = createServiceDto.description;
    service.defaultPrice = createServiceDto.defaultPrice;
    service.address = createServiceDto.address;

    const created = await this.serviceRepository.save(service);
    return created;
  }

  async findAll() {
    return await this.serviceRepository.find();
  }

  async findOne({ id }: { id: string }) {
    const service = await this.findOneByOrFail({ id });

    return service;
  }

  async update({
    serviceId,
    userId,
    updateServiceDto,
  }: {
    serviceId: string;
    userId: string;
    updateServiceDto: UpdateServiceDto;
  }) {
    const service = await this.checkServiceOwnership({ serviceId, userId });

    service.name = updateServiceDto.name ?? service.name;
    service.description = updateServiceDto.description ?? service.description;
    service.defaultPrice =
      updateServiceDto.defaultPrice ?? service.defaultPrice;
    service.address = updateServiceDto.address;

    const updated = await this.serviceRepository.save(service);
    return updated;
  }

  async remove({ userId, serviceId }: { userId: string; serviceId: string }) {
    const service = await this.checkServiceOwnership({ serviceId, userId });
    await this.serviceRepository.remove(service);
    return service;
  }

  async checkServiceOwnership({
    serviceId,
    userId,
  }: {
    serviceId: string;
    userId: string;
  }) {
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

  async searchServices(query: string): Promise<Service[]> {
    if (!query) {
      return this.serviceRepository.find({
        where: { isActive: true },
        relations: ['provider'],
      });
    }

    const searchString = `%${query}%`;

    return this.serviceRepository
      .createQueryBuilder('service')
      .where('service.isActive = :isActive', { isActive: true })
      .andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: searchString },
      )
      .leftJoinAndSelect('service.provider', 'provider')
      .getMany();
  }
}
