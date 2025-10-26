import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChargeScheduleService } from 'src/charge-schedule/charge-schedule.service';
import { ClientService } from 'src/client/client.service';
import { CreateServiceScheduleSimpleDto } from 'src/service-schedule/dto/create-service-schedule.dto';
import { ServiceSchedule } from 'src/service-schedule/entities/service-schedule.entity';
import { SERVICE_FREQUENCY } from 'src/service-schedule/enum/service-frequency.enum';
import { ServiceScheduleService } from 'src/service-schedule/service-schedule.service';
import { ServicesService } from 'src/services/services.service';
import { UserService } from 'src/user/user.service';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollments } from './entities/enrollment.entity';
import { ENROLLMENT_STATUS } from './enum/enrollment-status.enum';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollments)
    private readonly enrollmentsRepository: Repository<Enrollments>,
    @InjectRepository(ServiceSchedule)
    private readonly serviceScheduleRepository: Repository<ServiceSchedule>,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ServicesService))
    private readonly servicesService: ServicesService,
    private readonly clientService: ClientService,
    private readonly chargeScheduleService: ChargeScheduleService,
    private readonly serviceScheduleService: ServiceScheduleService,
  ) {}

  async findOneByOrFail(
    whereClause: FindOptionsWhere<Enrollments>,
    relations: string[] = [
      'service',
      'service.provider',
      'chargeSchedule',
      'serviceSchedules',
      'chargeExceptions',
      'client',
      'client.user',
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

    let enrollment: Enrollments = this.enrollmentsRepository.create({
      ...enrollmentData,
      service,
      client,
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

      return this.findOneByIdWithRelations(enrollment.id);
    } catch (error: unknown) {
      console.error(
        'Erro ao criar schedules, iniciando rollback para enrollment ID:',
        enrollment.id,
        error,
      );

      if (createdChargeScheduleId) {
        try {
          console.log(
            `Rollback: Deletando ChargeSchedule ID: ${createdChargeScheduleId}`,
          );
          await this.chargeScheduleService.remove({
            chargeScheduleId: createdChargeScheduleId,
          });
        } catch (cleanupError) {
          console.error(
            'Erro durante cleanup do ChargeSchedule:',
            cleanupError,
          );
        }
      }

      if (createdServiceSchedules.length > 0) {
        try {
          const idsToDelete = createdServiceSchedules.map(s => s.id);
          console.log(
            `Rollback: Deletando ServiceSchedules IDs: ${idsToDelete.join(', ')}`,
          );
          await this.serviceScheduleRepository.delete(idsToDelete);
        } catch (cleanupError) {
          console.error(
            'Erro durante cleanup dos ServiceSchedules:',
            cleanupError,
          );
        }
      }

      try {
        console.log(`Rollback: Deletando Enrollment ID: ${enrollment.id}`);
        await this.enrollmentsRepository.remove(enrollment);
      } catch (removeError) {
        console.error(
          `ERRO CRÍTICO: Falha ao remover Enrollment ${enrollment.id} durante rollback:`,
          removeError,
        );
      }

      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      // Re-throw original error if it's BadRequest, otherwise wrap it
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao criar agendamentos associados: ${message}`,
      );
    }
  }

  private async _createServiceSchedulesFromSimpleDto(
    enrollment: Enrollments,
    dto: CreateServiceScheduleSimpleDto,
  ): Promise<ServiceSchedule[]> {
    const schedulesToCreate: Partial<ServiceSchedule>[] = [];

    // Add specific check for WEEKLY missing days
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
      dto.daysOfWeek && // Checked above, but keep for safety
      dto.daysOfWeek.length > 0
    ) {
      dto.daysOfWeek.forEach(day => {
        schedulesToCreate.push({
          enrollment: enrollment,
          frequency: dto.frequency,
          daysOfWeek: [day], // Backend expects number[], frontend sends number[] now
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
      console.warn(
        `Lógica para ${SERVICE_FREQUENCY.CUSTOM_DAYS} não implementada.`,
      );
    } else if (dto.frequency) {
      // This will now likely catch MONTHLY without dayOfMonth
      throw new BadRequestException(
        `Dados insuficientes ou inválidos para a frequência ${dto.frequency}`,
      );
    }

    if (schedulesToCreate.length === 0 && dto.frequency) {
      console.warn(`Nenhum ServiceSchedule gerado para o DTO:`, dto);
      return [];
    } else if (schedulesToCreate.length === 0) {
      return [];
    }

    try {
      const createdSchedules =
        await this.serviceScheduleRepository.save(schedulesToCreate);
      return createdSchedules;
    } catch (error: unknown) {
      console.error('Erro ao salvar ServiceSchedules:', error);
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
      ],
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment com ID ${id} não encontrado.`);
    }
    return enrollment;
  }

  async findAll() {
    return await this.enrollmentsRepository.find({
      relations: ['serviceSchedules'],
    });
  }

  async findAllNeedsCharge() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.enrollmentsRepository.find({
      where: {
        status: ENROLLMENT_STATUS.ACTIVE,
      },
      relations: [
        'chargeSchedule',
        'serviceSchedules',
        'chargeExceptions',
        'charges',
        'client',
        'client.user',
        'service',
        'service.provider',
      ],
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
    });

    const {
      chargeSchedule: chargeScheduleDto,
      serviceSchedules: serviceScheduleSimpleDto, // Expect plural name from Update DTO
      ...enrollmentData
    } = updateEnrollmentDto;

    try {
      this.enrollmentsRepository.merge(enrollment, enrollmentData);
      const updatedEnrollment =
        await this.enrollmentsRepository.save(enrollment);

      if (chargeScheduleDto && updatedEnrollment.chargeSchedule) {
        await this.chargeScheduleService.update({
          chargeScheduleId: updatedEnrollment.chargeSchedule.id,
          updateChargeScheduleDto: chargeScheduleDto,
        });
      }

      if (serviceScheduleSimpleDto) {
        await this.serviceScheduleRepository.delete({
          enrollment: { id: enrollmentsId },
        });

        updatedEnrollment.serviceSchedules =
          await this._createServiceSchedulesFromSimpleDto(
            updatedEnrollment,
            serviceScheduleSimpleDto,
          );
        await this.enrollmentsRepository.save(updatedEnrollment);
      }

      return this.findOneByIdWithRelations(enrollmentsId);
    } catch (error: unknown) {
      console.error('Erro ao atualizar enrollment:', error);
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
    });
    await this.enrollmentsRepository.remove(enrollment);
    return enrollment;
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
      throw new BadRequestException('User is not a provider');
    }

    const enrollment = await this.findOneByOrFail({ id: enrollmentsId }, [
      'service',
      'service.provider',
      'serviceSchedules',
    ]);

    if (enrollment.service.provider.id !== user.providerProfile.id) {
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
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return enrollments;
  }
}
