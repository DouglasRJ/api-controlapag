import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChargeScheduleService } from 'src/charge-schedule/charge-schedule.service';
import { ClientService } from 'src/client/client.service';
import { ServiceScheduleService } from 'src/service-schedule/service-schedule.service';
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
    private readonly serviceScheduleService: ServiceScheduleService,
  ) {}

  async findOneByOrFail(enrollmentsData: Partial<Enrollments>) {
    const enrollments = await this.enrollmentsRepository.findOne({
      where: enrollmentsData,
      relations: [
        'service',
        'service.provider',
        'chargeSchedule',
        'serviceSchedule',
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

    const {
      chargeSchedule: chargeScheduleDto,
      serviceSchedule: serviceScheduleDto,
      ...enrollmentData
    } = createEnrollmentDto;

    let enrollment: Enrollments = this.enrollmentsRepository.create({
      ...enrollmentData,
      service,
      client,
    });
    enrollment = await this.enrollmentsRepository.save(enrollment);

    try {
      const chargeSchedule = await this.chargeScheduleService.create({
        createChargeScheduleDto: chargeScheduleDto,
        enrollmentId: enrollment.id,
      });

      const serviceSchedule = await this.serviceScheduleService.create(
        serviceScheduleDto,
        enrollment,
      );

      enrollment.chargeSchedule = chargeSchedule;
      enrollment.serviceSchedule = serviceSchedule;

      return this.findOneByOrFail({ id: enrollment.id });
    } catch (error) {
      await this.enrollmentsRepository.remove(enrollment);
      throw new BadRequestException(
        `Erro ao criar agendamentos: ${error.message}`,
      );
    }
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
      relations: [
        'chargeSchedule',
        'serviceSchedule',
        'chargeExceptions',
        'charges',
      ],
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

    const {
      chargeSchedule: chargeScheduleDto,
      serviceSchedule: serviceScheduleDto,
      ...enrollmentData
    } = updateEnrollmentDto;

    this.enrollmentsRepository.merge(enrollments, enrollmentData);

    if (chargeScheduleDto && enrollments.chargeSchedule) {
      await this.chargeScheduleService.update({
        chargeScheduleId: enrollments.chargeSchedule.id,
        updateChargeScheduleDto: chargeScheduleDto,
      });
    }

    if (serviceScheduleDto && enrollments.serviceSchedule) {
      Object.assign(enrollments.serviceSchedule, serviceScheduleDto);
      await this.serviceScheduleService.save(enrollments.serviceSchedule);
    }

    const updated = await this.enrollmentsRepository.save(enrollments);
    return this.findOneByOrFail({ id: updated.id });
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

    if (enrollments.service.provider.id !== user.providerProfile.id) {
      throw new UnauthorizedException(
        'User does not have permission to access this enrollment',
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
      relations: ['service', 'client', 'client.user', 'serviceSchedule'],
    });

    return enrollments;
  }
}
