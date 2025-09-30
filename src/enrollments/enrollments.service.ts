import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientService } from 'src/client/client.service';
import { ServicesService } from 'src/services/services.service';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollments } from './entities/enrollment.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollments)
    private readonly enrollmentsRepository: Repository<Enrollments>,
    private readonly userService: UserService,
    private readonly servicesService: ServicesService,
    private readonly clientService: ClientService,
  ) {}

  async findOneByOrFail(enrollmentsData: Partial<Enrollments>) {
    const enrollments = await this.enrollmentsRepository.findOne({
      where: enrollmentsData,
      relations: ['service', 'service.provider'],
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

    const enrollments: Enrollments = new Enrollments();

    enrollments.service = service;
    enrollments.client = client;

    enrollments.price = createEnrollmentDto.price;
    enrollments.startDate = createEnrollmentDto.startDate;
    enrollments.endDate = createEnrollmentDto.endDate;

    const created = await this.enrollmentsRepository.save(enrollments);
    return created;
  }

  async findAll() {
    return await this.enrollmentsRepository.find();
  }

  async findOne({ id }: { id: string }) {
    const enrollments = await this.findOneByOrFail({ id });

    if (!enrollments) {
      throw new NotFoundException('Enrollments not exists');
    }

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
}
