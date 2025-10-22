import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import { FindOptionsWhere, Repository } from 'typeorm'; // Importar FindOptionsWhere
import { CreateServiceScheduleDto } from './dto/create-service-schedule.dto';
import { ServiceSchedule } from './entities/service-schedule.entity';

@Injectable()
export class ServiceScheduleService {
  constructor(
    @InjectRepository(ServiceSchedule)
    private readonly serviceScheduleRepository: Repository<ServiceSchedule>,
  ) {}

  async findOneByOrFail(scheduleData: Partial<ServiceSchedule>) {
    const findOptions: FindOptionsWhere<ServiceSchedule> = {};
    if (scheduleData.id) {
      findOptions.id = scheduleData.id;
    }
    if (scheduleData.enrollment?.id) {
      findOptions.enrollment = { id: scheduleData.enrollment.id };
    }
    if (Object.keys(findOptions).length === 0) {
      throw new NotFoundException(
        'Criteria not provided for Service Schedule lookup.',
      );
    }

    const schedule = await this.serviceScheduleRepository.findOne({
      where: findOptions,
    });

    if (!schedule) {
      throw new NotFoundException('Service Schedule not found');
    }

    return schedule;
  }

  async create(
    createDto: CreateServiceScheduleDto,
    enrollment: Enrollments,
  ): Promise<ServiceSchedule> {
    const newSchedule = this.serviceScheduleRepository.create({
      ...createDto,
      enrollment: enrollment,
    });
    return this.serviceScheduleRepository.save(newSchedule);
  }

  async save(schedule: ServiceSchedule): Promise<ServiceSchedule> {
    return this.serviceScheduleRepository.save(schedule);
  }
}
