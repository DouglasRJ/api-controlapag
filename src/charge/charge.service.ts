import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreateManualChargeDto } from './dto/create-manual-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { Charge } from './entities/charge.entity';
import { CHARGE_STATUS } from './enum/charge-status.enum';

@Injectable()
export class ChargeService {
  constructor(
    @InjectRepository(Charge)
    private readonly chargeRepository: Repository<Charge>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async findOneByOrFail(chargeData: Partial<Charge>, getEnrollment = false) {
    const charge = await this.chargeRepository.findOne({
      where: chargeData,
      relations: [...(getEnrollment ? ['enrollment'] : [])],
    });

    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    return charge;
  }

  async create({
    createChargeDto,
    enrollmentId,
  }: {
    createChargeDto: CreateChargeDto;
    enrollmentId: string;
  }) {
    const enrollment = await this.enrollmentsService.findOneByOrFail({
      id: enrollmentId,
    });

    const charge = await this.chargeRepository.save({
      ...createChargeDto,
      enrollment,
    });
    return charge;
  }

  async findAll() {
    return await this.chargeRepository.find();
  }

  async findOne({ id }: { id: string }) {
    const charge = await this.findOneByOrFail({ id });
    return charge;
  }

  async update({
    chargeId,
    updateChargeDto,
  }: {
    chargeId: string;
    updateChargeDto: UpdateChargeDto;
  }) {
    const charge = await this.chargeRepository.findOneByOrFail({
      id: chargeId,
    });
    this.chargeRepository.merge(charge, updateChargeDto);

    return this.chargeRepository.save(charge);
  }

  async remove({ chargeId }: { chargeId: string }) {
    const charge = await this.findOneByOrFail({
      id: chargeId,
    });
    await this.chargeRepository.remove(charge);
    return charge;
  }

  async countByEnrollmentIdByDate({
    enrollmentId,
    date,
  }: {
    enrollmentId: string;
    date: Date;
  }) {
    const count = await this.chargeRepository.count({
      where: {
        enrollment: { id: enrollmentId },
        dueDate: date,
      },
    });

    return count;
  }

  async markAsPaid(chargeId: string, paidAt: Date): Promise<Charge> {
    const charge = await this.findOneByOrFail({ id: chargeId });
    charge.status = CHARGE_STATUS.PAID;
    charge.paidAt = paidAt;
    return this.chargeRepository.save(charge);
  }

  async getTotalRevenueForProviderInDateRange(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.chargeRepository
      .createQueryBuilder('charge')
      .select('SUM(charge.amount)', 'total')
      .innerJoin('charge.enrollment', 'enrollment')
      .innerJoin('enrollment.service', 'service')
      .where('service.providerId = :providerId', { providerId })
      .andWhere('charge.status = :status', { status: 'PAID' })
      .andWhere('charge.paidAt >= :startDate', { startDate })
      .andWhere('charge.paidAt <= :endDate', { endDate })
      .getRawOne<{ total: string }>();

    if (!result) return 0;

    return parseFloat(result.total) || 0;
  }

  async markAsFailed(chargeId: string): Promise<Charge> {
    const charge = await this.findOneByOrFail({ id: chargeId });
    if (charge.status === CHARGE_STATUS.PENDING) {
      charge.status = CHARGE_STATUS.CANCELED;
    }
    return this.chargeRepository.save(charge);
  }

  async createManualCharge(
    user: User,
    createManualChargeDto: CreateManualChargeDto,
  ) {
    const { enrollmentId, amount, dueDate } = createManualChargeDto;

    const enrollment = await this.enrollmentsService.findOneByOrFail({
      id: enrollmentId,
    });

    if (enrollment.service.provider.user.id !== user.id) {
      throw new UnauthorizedException(
        'You do not have permission to create charges for this enrollment.',
      );
    }

    const newCharge = this.chargeRepository.create({
      amount,
      dueDate,
      status: CHARGE_STATUS.PENDING,
      enrollment,
    });

    return this.chargeRepository.save(newCharge);
  }
}
