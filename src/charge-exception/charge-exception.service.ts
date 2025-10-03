import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { Repository } from 'typeorm';
import { CreateChargeExceptionDto } from './dto/create-charge-exception.dto';
import { UpdateChargeExceptionDto } from './dto/update-charge-exception.dto';
import { ChargeException } from './entities/charge-exception.entity';

@Injectable()
export class ChargeExceptionService {
  constructor(
    @InjectRepository(ChargeException)
    private readonly chargeExceptionRepository: Repository<ChargeException>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async findOneByOrFail(chargeExceptionData: Partial<ChargeException>) {
    const chargeException = await this.chargeExceptionRepository.findOne({
      where: chargeExceptionData,
    });

    if (!chargeException) {
      throw new NotFoundException('Charge Exception not found');
    }

    return chargeException;
  }

  async create({
    createChargeExceptionDto,
    enrollmentId,
  }: {
    createChargeExceptionDto: CreateChargeExceptionDto;
    enrollmentId: string;
  }) {
    const enrollment = await this.enrollmentsService.findOneByOrFail({
      id: enrollmentId,
    });

    const chargeException = await this.chargeExceptionRepository.save({
      ...createChargeExceptionDto,
      enrollment,
    });
    return chargeException;
  }

  async findAll() {
    return await this.chargeExceptionRepository.find();
  }

  async findOne({ id }: { id: string }) {
    const chargeException = await this.findOneByOrFail({ id });
    return chargeException;
  }

  async update({
    chargeExceptionId,
    updateChargeExceptionDto,
  }: {
    chargeExceptionId: string;
    updateChargeExceptionDto: UpdateChargeExceptionDto;
  }) {
    const chargeException =
      await this.chargeExceptionRepository.findOneByOrFail({
        id: chargeExceptionId,
      });

    this.chargeExceptionRepository.merge(
      chargeException,
      updateChargeExceptionDto,
    );

    return this.chargeExceptionRepository.save(chargeException);
  }

  async remove({ chargeExceptionId }: { chargeExceptionId: string }) {
    const chargeException = await this.findOneByOrFail({
      id: chargeExceptionId,
    });
    await this.chargeExceptionRepository.remove(chargeException);
    return chargeException;
  }
}
