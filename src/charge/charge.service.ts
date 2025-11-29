import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingEvents } from 'src/common/events/events';
import { GatewayPaymentService } from 'src/common/gatewayPayment/gateway-payment.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
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
    @Inject(forwardRef(() => EnrollmentsService))
    private readonly enrollmentsService: EnrollmentsService,
    @Inject(GatewayPaymentService)
    private readonly gatewayPaymentService: GatewayPaymentService,
    private readonly eventEmitter: EventEmitter2,
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
      organizationId: enrollment.organizationId,
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

  async findOneByPaymentGatewayId(
    paymentGatewayId: string,
  ): Promise<Charge | null> {
    return await this.chargeRepository.findOne({
      where: { paymentGatewayId },
    });
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
    const previousStatus = charge.status;
    this.chargeRepository.merge(charge, updateChargeDto);

    const savedCharge = await this.chargeRepository.save(charge);
    
    // Emitir evento se o status mudou para PAID
    if (
      previousStatus !== CHARGE_STATUS.PAID &&
      savedCharge.status === CHARGE_STATUS.PAID
    ) {
      this.eventEmitter.emit(BillingEvents.PAYMENT_RECEIVED, {
        charge: savedCharge,
        paidAt: savedCharge.paidAt || new Date(),
      });
    }

    return savedCharge;
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
    const savedCharge = await this.chargeRepository.save(charge);
    
    // Emitir evento de pagamento recebido
    this.eventEmitter.emit(BillingEvents.PAYMENT_RECEIVED, {
      charge: savedCharge,
      paidAt,
    });
    
    return savedCharge;
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
      organizationId: enrollment.organizationId,
    });

    return this.chargeRepository.save(newCharge);
  }

  async deletePendingChargesForEnrollment(
    enrollmentId: string,
    fromDate?: Date,
  ): Promise<void> {
    const queryBuilder = this.chargeRepository
      .createQueryBuilder()
      .delete()
      .from(Charge)
      .where('enrollmentId = :enrollmentId', { enrollmentId })
      .andWhere('status = :status', { status: CHARGE_STATUS.PENDING });

    if (fromDate) {
      queryBuilder.andWhere('dueDate >= :fromDate', { fromDate });
    }

    await queryBuilder.execute();
  }

  async refund(
    chargeId: string,
    user: User,
    options?: { amount?: number; reason?: string },
  ): Promise<Charge> {
    // Buscar charge com enrollment e provider
    const charge = await this.chargeRepository.findOne({
      where: { id: chargeId },
      relations: ['enrollment', 'enrollment.service', 'enrollment.service.provider', 'enrollment.service.provider.user'],
    });

    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    // Validar que charge está PAID
    if (charge.status !== CHARGE_STATUS.PAID) {
      throw new BadRequestException(
        'Only paid charges can be refunded',
      );
    }

    // Validar que tem paymentGatewayId
    if (!charge.paymentGatewayId) {
      throw new BadRequestException(
        'Charge does not have a payment gateway ID',
      );
    }

    // Validar permissões
    const isMasterOrSubProvider =
      user.role === USER_ROLE.MASTER || user.role === USER_ROLE.SUB_PROVIDER;
    const isIndividualOrProvider =
      user.role === USER_ROLE.INDIVIDUAL || user.role === USER_ROLE.PROVIDER;

    if (isMasterOrSubProvider) {
      // MASTER e SUB_PROVIDER devem ter a mesma organizationId da charge
      if (charge.organizationId !== user.organizationId) {
        throw new UnauthorizedException(
          'You do not have permission to refund this charge',
        );
      }
    } else if (isIndividualOrProvider) {
      // INDIVIDUAL/PROVIDER deve ser o dono do provider do serviço
      if (
        charge.enrollment?.service?.provider?.user?.id !== user.id
      ) {
        throw new UnauthorizedException(
          'You do not have permission to refund this charge',
        );
      }
    } else {
      throw new UnauthorizedException(
        'You do not have permission to refund charges',
      );
    }

    // Calcular valor do refund
    const refundAmount = options?.amount || charge.amount;
    const currentRefundedAmount = charge.refundedAmount || 0;
    const totalRefunded = currentRefundedAmount + refundAmount;

    // Validar que não está tentando refundar mais do que o valor pago
    if (totalRefunded > charge.amount) {
      throw new BadRequestException(
        `Cannot refund more than the charge amount. Current refunded: ${currentRefundedAmount}, attempting: ${refundAmount}, total: ${charge.amount}`,
      );
    }

    // Chamar Stripe para processar refund
    if (!this.gatewayPaymentService.refundCharge) {
      throw new BadRequestException('Refund is not supported by the payment gateway');
    }

    const refund = await this.gatewayPaymentService.refundCharge({
      paymentIntentId: charge.paymentGatewayId,
      amount: refundAmount,
      reason: options?.reason,
    });

    // Atualizar charge
    charge.refundedAmount = totalRefunded;

    // Atualizar status baseado no valor refundado
    if (totalRefunded >= charge.amount) {
      charge.status = CHARGE_STATUS.REFUNDED;
    } else {
      charge.status = CHARGE_STATUS.PARTIALLY_REFUNDED;
    }

    const savedCharge = await this.chargeRepository.save(charge);
    
    // Emitir evento de refund processado
    this.eventEmitter.emit(BillingEvents.REFUND_PROCESSED, {
      charge: savedCharge,
      refundAmount,
      totalRefunded,
      reason: options?.reason,
    });
    
    return savedCharge;
  }
}
