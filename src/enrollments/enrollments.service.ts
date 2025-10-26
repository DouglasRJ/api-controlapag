import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  addMonths,
  addWeeks,
  addYears,
  differenceInMonths,
  endOfDay,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns';
import { EXCEPTION_ACTION } from 'src/charge-exception/enum/exception-action.enum';
import { ChargeScheduleService } from 'src/charge-schedule/charge-schedule.service';
import { BILLING_MODEL } from 'src/charge-schedule/enum/billing-model.enum';
import { RECURRENCE_INTERVAL } from 'src/charge-schedule/enum/recurrence-interval.enum';
import { ChargeService } from 'src/charge/charge.service';
import { ClientService } from 'src/client/client.service';
import { CreateServiceScheduleSimpleDto } from 'src/service-schedule/dto/create-service-schedule.dto';
import { ServiceSchedule } from 'src/service-schedule/entities/service-schedule.entity';
import { SERVICE_FREQUENCY } from 'src/service-schedule/enum/service-frequency.enum';
import { ServicesService } from 'src/services/services.service';
import { UserService } from 'src/user/user.service';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollments } from './entities/enrollment.entity';
import { ENROLLMENT_STATUS } from './enum/enrollment-status.enum';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(Enrollments)
    private readonly enrollmentsRepository: Repository<Enrollments>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
    private readonly clientService: ClientService,
    private readonly chargeScheduleService: ChargeScheduleService,
    @Inject(forwardRef(() => ChargeService))
    private readonly chargeService: ChargeService,
    @InjectRepository(ServiceSchedule)
    private readonly serviceScheduleRepository: Repository<ServiceSchedule>,
  ) {}

  async findOneByOrFail(
    whereClause: FindOptionsWhere<Enrollments>,
    relations: string[] = [
      'service',
      'service.provider',
      'service.provider.user',
      'chargeSchedule',
      'serviceSchedules',
      'chargeExceptions',
      'client',
      'client.user',
      'charges',
    ],
  ): Promise<Enrollments> {
    const enrollments = await this.enrollmentsRepository.findOne({
      where: whereClause,
      relations: relations,
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
      serviceSchedules: serviceScheduleSimpleDto,
      ...enrollmentData
    } = createEnrollmentDto;

    const startDate = parseISO(enrollmentData.startDate);
    const endDate = enrollmentData.endDate
      ? parseISO(enrollmentData.endDate)
      : undefined;

    let enrollment: Enrollments = this.enrollmentsRepository.create({
      ...enrollmentData,
      startDate: startDate,
      endDate: endDate,
      service,
      client,
      status: ENROLLMENT_STATUS.ACTIVE,
    });

    enrollment = await this.enrollmentsRepository.save(enrollment);

    let createdChargeScheduleId: string | null = null;
    let createdServiceSchedules: ServiceSchedule[] = [];

    try {
      if (chargeScheduleDto) {
        const chargeSchedule = await this.chargeScheduleService.create({
          createChargeScheduleDto: chargeScheduleDto,
          enrollmentId: enrollment.id,
        });
        createdChargeScheduleId = chargeSchedule.id;
        enrollment.chargeSchedule = chargeSchedule;
      }

      if (serviceScheduleSimpleDto) {
        createdServiceSchedules =
          await this._createServiceSchedulesFromSimpleDto(
            enrollment,
            serviceScheduleSimpleDto,
          );
        enrollment.serviceSchedules = createdServiceSchedules;
      }

      enrollment = await this.enrollmentsRepository.save(enrollment);

      await this._generateFutureCharges(enrollment);

      return this.findOneByIdWithRelations(enrollment.id);
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao criar schedules ou gerar cobranças, iniciando rollback para enrollment ID:',
        enrollment.id,
        error,
      );

      if (createdChargeScheduleId) {
        try {
          await this.chargeScheduleService.remove({
            chargeScheduleId: createdChargeScheduleId,
          });
        } catch (cleanupError) {
          this.logger.error(
            'Erro durante cleanup do ChargeSchedule:',
            cleanupError,
          );
        }
      }
      if (createdServiceSchedules.length > 0) {
        try {
          const idsToDelete = createdServiceSchedules.map(s => s.id);
          await this.serviceScheduleRepository.delete(idsToDelete);
        } catch (cleanupError) {
          this.logger.error(
            'Erro durante cleanup dos ServiceSchedules:',
            cleanupError,
          );
        }
      }

      try {
        await this.enrollmentsRepository.remove(enrollment);
      } catch (removeError) {
        this.logger.error(
          `ERRO CRÍTICO: Falha ao remover Enrollment ${enrollment.id} durante rollback:`,
          removeError,
        );
      }

      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao criar matrícula: ${message}`);
    }
  }

  private async _generateFutureCharges(enrollment: Enrollments): Promise<void> {
    this.logger.log(
      `Gerando cobranças futuras para a matrícula ${enrollment.id}...`,
    );

    if (!enrollment.chargeSchedule) {
      this.logger.warn(
        `Matrícula ${enrollment.id} não possui ChargeSchedule. Nenhuma cobrança será gerada.`,
      );
      return;
    }

    const fullEnrollment = await this.findOneByOrFail({ id: enrollment.id }, [
      'chargeExceptions',
      'chargeSchedule',
    ]);
    const {
      chargeSchedule,
      chargeExceptions = [],
      price,
      startDate,
      endDate,
    } = fullEnrollment;

    const generationEndDate = endDate
      ? endOfDay(endDate)
      : addYears(startOfDay(startDate), 2);

    let currentDate = startOfDay(startDate);

    while (
      isBefore(currentDate, generationEndDate) ||
      isSameDay(currentDate, generationEndDate)
    ) {
      let chargeDate = currentDate;
      let chargeAmount = price;
      let skipCharge = false;

      const exception = chargeExceptions.find(ex =>
        isSameDay(startOfDay(ex.originalChargeDate), currentDate),
      );

      if (exception) {
        this.logger.log(
          `Exceção encontrada para ${enrollment.id} em ${currentDate.toISOString().split('T')[0]}: ${exception.action}`,
        );
        if (exception.action === EXCEPTION_ACTION.SKIP) {
          skipCharge = true;
        } else if (exception.action === EXCEPTION_ACTION.POSTPONE) {
          chargeDate = startOfDay(exception.newDueDate!);
          chargeAmount = exception.newAmount ?? price;
        } else if (exception.action === EXCEPTION_ACTION.MODIFY_AMOUNT) {
          chargeAmount = exception.newAmount!;
        }
      }

      if (!skipCharge) {
        let shouldCreateCharge = false;
        if (chargeSchedule.billingModel === BILLING_MODEL.ONE_TIME) {
          if (
            chargeSchedule.dueDate &&
            isSameDay(startOfDay(chargeSchedule.dueDate), currentDate)
          ) {
            shouldCreateCharge = true;
            chargeDate = startOfDay(chargeSchedule.dueDate);
          }
        } else if (chargeSchedule.billingModel === BILLING_MODEL.RECURRING) {
          const dayOfMonthMatches =
            currentDate.getDate() === chargeSchedule.chargeDay;
          const monthDiff = differenceInMonths(
            currentDate,
            startOfDay(startDate),
          );

          switch (chargeSchedule.recurrenceInterval) {
            case RECURRENCE_INTERVAL.WEEKLY:
              if (currentDate.getDay() === startOfDay(startDate).getDay()) {
                shouldCreateCharge = true;
              }
              break;
            case RECURRENCE_INTERVAL.MONTHLY:
              if (dayOfMonthMatches) shouldCreateCharge = true;
              break;
            case RECURRENCE_INTERVAL.BIMONTHLY:
              if (dayOfMonthMatches && monthDiff >= 0 && monthDiff % 2 === 0)
                shouldCreateCharge = true;
              break;
            case RECURRENCE_INTERVAL.TRIMESTERLY:
              if (dayOfMonthMatches && monthDiff >= 0 && monthDiff % 3 === 0)
                shouldCreateCharge = true;
              break;
            case RECURRENCE_INTERVAL.SEMIANNUALLY:
              if (dayOfMonthMatches && monthDiff >= 0 && monthDiff % 6 === 0)
                shouldCreateCharge = true;
              break;
            case RECURRENCE_INTERVAL.YEARLY:
              if (
                dayOfMonthMatches &&
                currentDate.getMonth() === startOfDay(startDate).getMonth() &&
                monthDiff >= 0 &&
                monthDiff % 12 === 0
              )
                shouldCreateCharge = true;
              break;
          }
        }

        if (
          shouldCreateCharge &&
          (isBefore(chargeDate, generationEndDate) ||
            isSameDay(chargeDate, generationEndDate))
        ) {
          const chargeExists =
            (await this.chargeService.countByEnrollmentIdByDate({
              enrollmentId: enrollment.id,
              date: chargeDate,
            })) > 0;

          if (!chargeExists) {
            try {
              await this.chargeService.create({
                enrollmentId: enrollment.id,
                createChargeDto: {
                  amount: chargeAmount,
                  dueDate: chargeDate.toISOString().split('T')[0],
                },
              });
              this.logger.verbose(
                `Cobrança criada para ${enrollment.id} em ${chargeDate.toISOString().split('T')[0]}`,
              );
            } catch (chargeError) {
              this.logger.error(
                `Falha ao criar cobrança para ${enrollment.id} em ${chargeDate.toISOString().split('T')[0]}`,
                chargeError,
              );
            }
          } else {
            this.logger.verbose(
              `Cobrança já existe para ${enrollment.id} em ${chargeDate.toISOString().split('T')[0]}, pulando.`,
            );
          }
        }
      }

      currentDate = addMonths(currentDate, 0);
      currentDate.setDate(currentDate.getDate() + 1);

      if (
        chargeSchedule.billingModel === BILLING_MODEL.RECURRING &&
        chargeSchedule.recurrenceInterval !== RECURRENCE_INTERVAL.WEEKLY &&
        currentDate.getDate() !== 1
      ) {
        const targetDay = chargeSchedule.chargeDay;
        currentDate = addMonths(currentDate, 1);
        const daysInMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        ).getDate();
        currentDate.setDate(Math.min(targetDay, daysInMonth));
        currentDate = startOfDay(currentDate);
      } else if (
        chargeSchedule.billingModel === BILLING_MODEL.RECURRING &&
        chargeSchedule.recurrenceInterval === RECURRENCE_INTERVAL.WEEKLY
      ) {
        currentDate = addWeeks(currentDate, 1);
        currentDate = startOfDay(currentDate);
      }
    }
    this.logger.log(
      `Geração de cobranças futuras concluída para a matrícula ${enrollment.id}.`,
    );
  }

  async findAll() {
    return await this.enrollmentsRepository.find({
      relations: ['serviceSchedules'],
    });
  }

  async findOne({ id }: { id: string }) {
    const enrollments = await this.findOneByIdWithRelations(id);
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
    const enrollment = await this.checkEnrollmentOwnership({
      enrollmentsId,
      userId,

      relations: [
        'chargeSchedule',
        'serviceSchedules',
        'charges',
        'service',
        'service.provider',
        'service.provider.user',
        'client',
        'client.user',
      ],
    });

    const originalData = {
      price: enrollment.price,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      status: enrollment.status,
      chargeScheduleId: enrollment.chargeSchedule?.id,
    };

    const {
      chargeSchedule: chargeScheduleDto,
      serviceSchedules: serviceScheduleSimpleDto,
      status,
      ...enrollmentData
    } = updateEnrollmentDto;

    const startDateUpdate = enrollmentData.startDate
      ? parseISO(enrollmentData.startDate)
      : undefined;
    const endDateUpdate = enrollmentData.endDate
      ? parseISO(enrollmentData.endDate)
      : undefined;

    try {
      this.enrollmentsRepository.merge(enrollment, {
        ...enrollmentData,
        startDate: startDateUpdate,
        endDate: endDateUpdate,
        status: status ?? enrollment.status,
      });

      let chargeScheduleChanged = false;

      if (chargeScheduleDto) {
        if (enrollment.chargeSchedule) {
          const updatedSchedule = await this.chargeScheduleService.update({
            chargeScheduleId: enrollment.chargeSchedule.id,
            updateChargeScheduleDto: chargeScheduleDto,
          });
          enrollment.chargeSchedule = updatedSchedule;
          chargeScheduleChanged = true;
        } else {
          const newSchedule = await this.chargeScheduleService.create({
            createChargeScheduleDto: chargeScheduleDto,
            enrollmentId: enrollment.id,
          });
          enrollment.chargeSchedule = newSchedule;
          chargeScheduleChanged = true;
        }
      }

      let serviceSchedulesChanged = false;
      if (serviceScheduleSimpleDto) {
        serviceSchedulesChanged = true;
        await this.serviceScheduleRepository.delete({
          enrollment: { id: enrollmentsId },
        });
        enrollment.serviceSchedules =
          await this._createServiceSchedulesFromSimpleDto(
            enrollment,
            serviceScheduleSimpleDto,
          );
      }

      const updatedEnrollment =
        await this.enrollmentsRepository.save(enrollment);

      const needsChargeRegeneration =
        (startDateUpdate &&
          !isSameDay(originalData.startDate, startDateUpdate)) ||
        (endDateUpdate !== undefined &&
          (!originalData.endDate ||
            !isSameDay(originalData.endDate, endDateUpdate))) ||
        (enrollmentData.price !== undefined &&
          originalData.price !== enrollmentData.price) ||
        (status !== undefined && originalData.status !== status) ||
        chargeScheduleChanged ||
        serviceSchedulesChanged;

      if (needsChargeRegeneration) {
        this.logger.log(
          `Regerando cobranças futuras para matrícula ${enrollmentsId} devido a atualização.`,
        );

        const regenerationStartDate =
          startDateUpdate && isBefore(new Date(), startDateUpdate)
            ? startDateUpdate
            : new Date();
        await this.chargeService.deletePendingChargesForEnrollment(
          enrollmentsId,
          startOfDay(regenerationStartDate),
        );

        if (updatedEnrollment.status === ENROLLMENT_STATUS.ACTIVE) {
          const enrollmentForChargeGen = await this.findOneByOrFail(
            { id: enrollmentsId },
            ['chargeExceptions', 'chargeSchedule'],
          );
          await this._generateFutureCharges(enrollmentForChargeGen);
        } else {
          this.logger.log(
            `Matrícula ${enrollmentsId} não está ativa. Cobranças futuras não foram regeradas.`,
          );
        }
      }

      return this.findOneByIdWithRelations(enrollmentsId);
    } catch (error: unknown) {
      this.logger.error('Erro ao atualizar enrollment:', error);
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(`Erro ao atualizar contrato: ${message}`);
    }
  }

  async remove({
    userId,
    enrollmentsId,
  }: {
    userId: string;
    enrollmentsId: string;
  }) {
    const enrollment = await this.checkEnrollmentOwnership({
      enrollmentsId,
      userId,

      relations: [
        'charges',
        'service',
        'service.provider',
        'service.provider.user',
      ],
    });

    await this.enrollmentsRepository.remove(enrollment);
    this.logger.log(`Matrícula ${enrollmentsId} removida.`);

    return enrollment;
  }

  async checkEnrollmentOwnership({
    enrollmentsId,
    userId,
    relations = [
      'service',
      'service.provider',
      'service.provider.user',
      'serviceSchedules',
    ],
  }: {
    enrollmentsId: string;
    userId: string;
    relations?: string[];
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile) {
      throw new BadRequestException('User is not a provider');
    }

    const enrollment = await this.findOneByOrFail(
      { id: enrollmentsId },
      relations,
    );

    if (!enrollment.service?.provider?.user) {
      this.logger.error(
        `Falha ao carregar provider ou user para a matrícula ${enrollmentsId}`,
      );
      throw new InternalServerErrorException(
        'Erro ao verificar propriedade da matrícula.',
      );
    }

    if (enrollment.service.provider.user.id !== user.id) {
      throw new UnauthorizedException(
        'User does not have permission to access this enrollment',
      );
    }

    return enrollment;
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
      relations: [
        'service',
        'client',
        'client.user',
        'serviceSchedules',
        'chargeSchedule',
        'charges',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return enrollments;
  }

  private async _createServiceSchedulesFromSimpleDto(
    enrollment: Enrollments,
    dto: CreateServiceScheduleSimpleDto,
  ): Promise<ServiceSchedule[]> {
    const schedulesToCreate: Partial<ServiceSchedule>[] = [];

    if (
      dto.frequency === SERVICE_FREQUENCY.WEEKLY &&
      (!dto.daysOfWeek || dto.daysOfWeek.length === 0)
    ) {
      throw new BadRequestException(
        'Para frequência Semanal, é necessário selecionar pelo menos um dia da semana.',
      );
    }

    if (
      dto.frequency === SERVICE_FREQUENCY.WEEKLY &&
      dto.daysOfWeek &&
      dto.daysOfWeek.length > 0
    ) {
      dto.daysOfWeek.forEach(day => {
        schedulesToCreate.push({
          enrollment: enrollment,
          frequency: dto.frequency,
          daysOfWeek: [day],
          startTime: dto.startTime,
          endTime: dto.endTime,
          dayOfMonth: undefined,
        });
      });
    } else if (dto.frequency === SERVICE_FREQUENCY.MONTHLY && dto.dayOfMonth) {
      schedulesToCreate.push({
        enrollment: enrollment,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        startTime: dto.startTime,
        endTime: dto.endTime,
        daysOfWeek: undefined,
      });
    } else if (dto.frequency === SERVICE_FREQUENCY.DAILY) {
      schedulesToCreate.push({
        enrollment: enrollment,
        frequency: dto.frequency,
        startTime: dto.startTime,
        endTime: dto.endTime,
        daysOfWeek: undefined,
        dayOfMonth: undefined,
      });
    } else if (dto.frequency === SERVICE_FREQUENCY.CUSTOM_DAYS) {
      this.logger.warn(
        `Lógica para ${SERVICE_FREQUENCY.CUSTOM_DAYS} não implementada.`,
      );
    } else if (dto.frequency) {
      throw new BadRequestException(
        `Dados insuficientes ou inválidos para a frequência ${dto.frequency}`,
      );
    }

    if (schedulesToCreate.length === 0 && dto.frequency) {
      this.logger.warn(`Nenhum ServiceSchedule gerado para o DTO:`, dto);
      return [];
    } else if (schedulesToCreate.length === 0) {
      return [];
    }

    try {
      const createdSchedules =
        await this.serviceScheduleRepository.save(schedulesToCreate);
      return createdSchedules;
    } catch (error: unknown) {
      this.logger.error('Erro ao salvar ServiceSchedules:', error);
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(
        `Não foi possível salvar os agendamentos de serviço: ${message}`,
      );
    }
  }

  async findOneByIdWithRelations(id: string): Promise<Enrollments> {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id },
      relations: [
        'service',
        'service.provider',
        'client',
        'client.user',
        'chargeSchedule',
        'serviceSchedules',
        'chargeExceptions',
        'charges',
      ],
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment com ID ${id} não encontrado.`);
    }
    return enrollment;
  }
}
