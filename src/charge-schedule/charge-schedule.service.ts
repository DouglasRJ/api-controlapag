import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChargeScheduleDto } from './dto/create-charge-schedule.dto';
import { UpdateChargeScheduleDto } from './dto/update-charge-schedule.dto';
import { ChargeSchedule } from './entities/charge-schedule.entity';

@Injectable()
export class ChargeScheduleService {
  constructor(
    @InjectRepository(ChargeSchedule)
    private readonly chargeScheduleRepository: Repository<ChargeSchedule>,
  ) {}

  async findOneByOrFail(chargeScheduleData: Partial<ChargeSchedule>) {
    const chargeSchedule = await this.chargeScheduleRepository.findOne({
      where: chargeScheduleData,
    });

    if (!chargeSchedule) {
      throw new NotFoundException('Charge Schedule not found');
    }

    return chargeSchedule;
  }

  async create({
    createChargeScheduleDto,
    enrollmentId,
  }: {
    createChargeScheduleDto: CreateChargeScheduleDto;
    enrollmentId: string;
  }) {
    const chargeSchedule = await this.chargeScheduleRepository.save({
      ...createChargeScheduleDto,
      enrollment: { id: enrollmentId },
    });
    return chargeSchedule;
  }

  async findAll() {
    return await this.chargeScheduleRepository.find();
  }

  async findOne({ id }: { id: string }) {
    const chargeSchedule = await this.findOneByOrFail({ id });
    return chargeSchedule;
  }

  async update({
    chargeScheduleId,
    updateChargeScheduleDto,
  }: {
    chargeScheduleId: string;
    updateChargeScheduleDto: UpdateChargeScheduleDto;
  }) {
    const chargeSchedule = await this.chargeScheduleRepository.findOneByOrFail({
      id: chargeScheduleId,
    });

    this.chargeScheduleRepository.merge(
      chargeSchedule,
      updateChargeScheduleDto,
    );

    return this.chargeScheduleRepository.save(chargeSchedule);
  }

  async remove({ chargeScheduleId }: { chargeScheduleId: string }) {
    const chargeSchedule = await this.findOneByOrFail({ id: chargeScheduleId });
    await this.chargeScheduleRepository.remove(chargeSchedule);
    return chargeSchedule;
  }
}
