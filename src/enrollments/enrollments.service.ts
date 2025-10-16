import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChargeScheduleService } from 'src/charge-schedule/charge-schedule.service';
import { ClientService } from 'src/client/client.service';
import { ServicesService } from 'src/services/services.service';
import { UserService } from 'src/user/user.service';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollments } from './entities/enrollment.entity';
import { ENROLLMENT_STATUS } from './enum/enrollment-status.enum';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollments)
    private readonly enrollmentsRepository: Repository<Enrollments>,
    private readonly userService: UserService,
    private readonly servicesService: ServicesService,
    private readonly clientService: ClientService,
    private readonly chargeScheduleService: ChargeScheduleService,
  ) {}

  async findOneByOrFail(enrollmentsData: Partial<Enrollments>) {
    const enrollments = await this.enrollmentsRepository.findOne({
      where: enrollmentsData,
      relations: [
        'service',
        'service.provider',
        'chargeSchedule',
        'chargeExceptions',
      ],
    });

    if (!enrollments) {
      throw new NotFoundException('Enrollments not found');
    }

    return enrollments;
  }

  async create({
    userId,
    createEnrollmentDto,
  }: {
    userId: string;
    createEnrollmentDto: CreateEnrollmentDto;
  }) {
    const service = await this.servicesService.checkServiceOwnership({
      serviceId: createEnrollmentDto.serviceId,
      userId,
    });

    const client = await this.clientService.findOneByOrFail({
      id: createEnrollmentDto.clientId,
    });

    if (!client) {
      throw new BadRequestException('Client not exists');
    }

    let enrollment: Enrollments = new Enrollments();

    enrollment.service = service;
    enrollment.client = client;

    enrollment = await this.enrollmentsRepository.save({
      ...enrollment,
      ...createEnrollmentDto,
    });

    const chargeSchedule = await this.chargeScheduleService.create({
      createChargeScheduleDto: createEnrollmentDto.chargeSchedule,
      enrollmentId: enrollment.id,
    });

    enrollment.chargeSchedule = chargeSchedule;

    enrollment = await this.enrollmentsRepository.save(enrollment);

    return enrollment;
  }

  async findAll() {
    return await this.enrollmentsRepository.find();
  }

  async findAllNeedsCharge() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.enrollmentsRepository.find({
      where: {
        status: ENROLLMENT_STATUS.ACTIVE,
        startDate: MoreThanOrEqual(today),
      },
      relations: ['chargeSchedule', 'chargeExceptions', 'charges'],
    });
  }

  async findOne({ id }: { id: string }) {
    const enrollments = await this.findOneByOrFail({ id });

    return enrollments;
  }

  async update({
    enrollmentsId,
    userId,
    updateEnrollmentDto,
  }: {
    enrollmentsId: string;
    userId: string;
    updateEnrollmentDto: UpdateEnrollmentDto;
  }) {
    const enrollments = await this.checkEnrollmentOwnership({
      enrollmentsId,
      userId,
    });

    enrollments.price = updateEnrollmentDto.price ?? enrollments.price;
    enrollments.startDate =
      updateEnrollmentDto.startDate ?? enrollments.startDate;
    enrollments.endDate = updateEnrollmentDto.endDate ?? enrollments.endDate;

    const updated = await this.enrollmentsRepository.save(enrollments);
    return updated;
  }

  async remove({
    userId,
    enrollmentsId,
  }: {
    userId: string;
    enrollmentsId: string;
  }) {
    const enrollments = await this.checkEnrollmentOwnership({
      enrollmentsId,
      userId,
    });

    await this.enrollmentsRepository.remove(enrollments);
    return enrollments;
  }

  async checkEnrollmentOwnership({
    enrollmentsId,
    userId,
  }: {
    enrollmentsId: string;
    userId: string;
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile) {
      throw new BadRequestException('User not have enrollments');
    }

    const enrollments = await this.findOneByOrFail({ id: enrollmentsId });

    if (!enrollments) {
      throw new NotFoundException('Enrollments not exists');
    }

    if (enrollments.service.provider.id !== user.providerProfile.id) {
      throw new UnauthorizedException(
        'User does not have permission to update this enrollments',
      );
    }

    return enrollments;
  }

  async countActiveEnrollmentsForProvider(providerId: string): Promise<number> {
    return this.enrollmentsRepository.count({
      where: {
        service: { provider: { id: providerId } },
        status: ENROLLMENT_STATUS.ACTIVE,
      },
    });
  }

  async countNewEnrollmentsForProviderInDateRange(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.enrollmentsRepository.count({
      where: {
        service: { provider: { id: providerId } },
        createdAt: Between(startDate, endDate),
      },
    });
  }

  async findAllByProvider({ providerId }: { providerId: string }) {
    if (!providerId) {
      throw new BadRequestException('Provider Id is missing');
    }

    const enrollments = await this.enrollmentsRepository.find({
      where: {
        service: {
          provider: {
            id: providerId,
          },
        },
      },
      relations: ['service', 'client', 'client.user'],
    });

    return enrollments;
  }
}
