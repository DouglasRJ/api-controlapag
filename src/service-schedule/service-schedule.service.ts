import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollments } from 'src/enrollments/entities/enrollment.entity';
import { Repository } from 'typeorm';
import { CreateServiceScheduleDto } from './dto/create-service-schedule.dto';
import { ServiceSchedule } from './entities/service-schedule.entity';
// Import Update DTO if created
// import { UpdateServiceScheduleDto } from './dto/update-service-schedule.dto';

@Injectable()
export class ServiceScheduleService {
  constructor(
    @InjectRepository(ServiceSchedule)
    private readonly serviceScheduleRepository: Repository<ServiceSchedule>,
  ) {}

  async findOneByOrFail(scheduleData: Partial<ServiceSchedule>) {
    const schedule = await this.serviceScheduleRepository.findOne({
      where: scheduleData,
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

  // async update(...) {}
  // async remove(...) {}
}
