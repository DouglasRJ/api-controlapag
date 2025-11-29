import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  eachDayOfInterval,
  endOfDay,
  getDate,
  getDay,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import { ENROLLMENT_STATUS } from 'src/enrollments/enum/enrollment-status.enum';
import { ServiceSchedule } from 'src/service-schedule/entities/service-schedule.entity';
import { SERVICE_FREQUENCY } from 'src/service-schedule/enum/service-frequency.enum';
import { UserService } from 'src/user/user.service';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceOccurrenceDto } from './dto/service-ocurrence-dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly userService: UserService,
    @InjectRepository(Enrollments)
    private readonly enrollmentRepository: Repository<Enrollments>,
  ) {}

  async findOneByOrFail(serviceData: FindOptionsWhere<Service>) {
    const { allowedPaymentMethods, ...findCriteria } = serviceData;

    const service = await this.serviceRepository.findOne({
      where: findCriteria,
      relations: [
        'provider',
        'enrollments',
        'enrollments.client',
        'enrollments.client.user',
        'enrollments.service',
        'enrollments.serviceSchedules',
        'enrollments.chargeSchedule',
      ],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findAllByProvider({
    providerId,
    organizationId,
    query,
    isActive,
  }: {
    providerId: string;
    organizationId?: string;
    query?: string;
    isActive?: boolean;
  }) {
    if (!providerId) {
      throw new BadRequestException('Provider Id is missing');
    }

    const qb = this.serviceRepository.createQueryBuilder('service');
    qb.where('service.providerId = :providerId', { providerId });

    // Filtrar por organizationId se fornecido
    if (organizationId) {
      qb.andWhere('service.organizationId = :organizationId', { organizationId });
    }

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
    service.organizationId = user.organizationId || user.providerProfile?.organizationId;

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
    service.isRecurrent =
      updateServiceDto.isRecurrent !== undefined
        ? updateServiceDto.isRecurrent
        : service.isRecurrent;

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

  async findOccurrencesForService(
    userId: string,
    serviceId: string,
    queryStartDate: Date,
    queryEndDate: Date,
  ): Promise<ServiceOccurrenceDto[]> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['provider', 'provider.user'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }
    if (service.provider.user.id !== userId) {
      throw new UnauthorizedException('User does not own this service');
    }

    const activeEnrollments = await this.enrollmentRepository.find({
      where: {
        service: { id: serviceId },
        status: ENROLLMENT_STATUS.ACTIVE,
      },
      relations: ['serviceSchedules', 'client', 'client.user'],
    });

    const allOccurrences: ServiceOccurrenceDto[] = [];
    const interval = { start: queryStartDate, end: queryEndDate };

    const daysToCheck = eachDayOfInterval(interval);

    for (const currentDate of daysToCheck) {
      const currentDayStart = startOfDay(currentDate);

      for (const enrollment of activeEnrollments) {
        if (!this._isEnrollmentActiveOnDate(enrollment, currentDayStart)) {
          continue;
        }

        for (const schedule of enrollment.serviceSchedules || []) {
          if (this._doesScheduleMatchDate(schedule, currentDayStart)) {
            allOccurrences.push(
              new ServiceOccurrenceDto({
                enrollmentId: enrollment.id,
                clientId: enrollment.client.id,
                clientName:
                  enrollment.client.user?.username ?? 'Cliente sem nome',
                date: currentDayStart,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
              }),
            );
          }
        }
      }
    }

    return allOccurrences;
  }

  private _isEnrollmentActiveOnDate(
    enrollment: Enrollments,
    date: Date,
  ): boolean {
    const enrollmentStart = startOfDay(parseISO(String(enrollment.startDate)));
    if (isBefore(date, enrollmentStart)) {
      return false;
    }
    if (enrollment.endDate) {
      const enrollmentEnd = endOfDay(parseISO(String(enrollment.endDate)));
      if (isAfter(date, enrollmentEnd)) {
        return false;
      }
    }
    return true;
  }

  private _doesScheduleMatchDate(
    schedule: ServiceSchedule,
    date: Date,
  ): boolean {
    const dayOfWeek = getDay(date);
    const dayOfMonth = getDate(date);

    switch (schedule.frequency) {
      case SERVICE_FREQUENCY.DAILY:
        return true;

      case SERVICE_FREQUENCY.WEEKLY:
        return schedule.daysOfWeek?.includes(dayOfWeek) ?? false;

      case SERVICE_FREQUENCY.MONTHLY:
        return schedule.dayOfMonth === dayOfMonth;

      case SERVICE_FREQUENCY.CUSTOM_DAYS:
        return false;

      default:
        return false;
    }
  }
}
