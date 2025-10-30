import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { GatewayPaymentService } from 'src/common/gatewayPayment/gateway-payment.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { ServicesService } from 'src/services/services.service';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Provider } from './entities/provider.entity';
import { PROVIDER_STATUS } from './enum/provider-status.enum';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);

  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly userService: UserService,
    private readonly gatewayPaymentService: GatewayPaymentService,
    private readonly servicesService: ServicesService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly configService: ConfigService,
  ) {}

  async findOneByOrFail(
    providerData: Partial<Provider>,
    getEnrollments = false,
  ) {
    const { services, ...findCriteria } = providerData;

    const provider = await this.providerRepository.findOne({
      where: findCriteria,
      relations: [
        'user',
        'services',
        ...(getEnrollments ? ['services.enrollments'] : []),
      ],
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  async create({
    userId,
    createProviderDto,
  }: {
    userId: string;
    createProviderDto: CreateProviderDto;
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    const provider: Provider = new Provider();

    provider.title = createProviderDto.title;
    provider.address = createProviderDto.address;
    provider.bio = createProviderDto.bio;
    provider.businessPhone = createProviderDto.businessPhone;
    provider.status = PROVIDER_STATUS.PENDING_VERIFICATION;

    provider.user = user;

    const created = await this.providerRepository.save(provider);
    return created;
  }

  findAll() {
    return this.providerRepository.find();
  }

  async findOne({ userId }: { userId: string }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile) {
      throw new BadRequestException('User not have Provider Profile');
    }

    const provider = await this.findOneByOrFail(
      {
        id: user.providerProfile.id,
      },
      true,
    );

    return provider;
  }

  async update({
    providerId,
    userId,
    updateProviderDto,
  }: {
    providerId: string;
    userId: string;
    updateProviderDto: UpdateProviderDto;
  }) {
    this.logger.log(
      `ProviderService 'update' called for providerId: ${providerId} by (alleged) userId: ${userId}. DTO: ${JSON.stringify(updateProviderDto)}`,
    );

    let provider: Provider;
    try {
      provider = await this.checkProviderOwnership({
        providerId,
        userId,
      });
      this.logger.log(
        `checkProviderOwnership passed successfully for providerId: ${providerId} and userId: ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `checkProviderOwnership FAILED for providerId: ${providerId} and userId: ${userId}. Error: ${error.message}`,
      );
      throw error;
    }

    provider.title = updateProviderDto.title ?? provider.title;
    provider.address = updateProviderDto.address ?? provider.address;
    provider.bio = updateProviderDto.bio ?? provider.bio;
    provider.businessPhone =
      updateProviderDto.businessPhone ?? provider.businessPhone;

    if (updateProviderDto.status) {
      this.logger.log(
        `Updating status from ${provider.status} to ${updateProviderDto.status}`,
      );
      provider.status = updateProviderDto.status;
    } else {
      this.logger.log(
        `No status update in DTO, keeping current status: ${provider.status}`,
      );
    }

    if (
      updateProviderDto.providerPaymentId &&
      provider.providerPaymentId !== updateProviderDto.providerPaymentId
    ) {
      this.logger.warn(
        `Updating providerPaymentId from ${provider.providerPaymentId} to ${updateProviderDto.providerPaymentId}`,
      );
      provider.providerPaymentId = updateProviderDto.providerPaymentId;
    }

    if (updateProviderDto.paymentCustomerId) {
      provider.paymentCustomerId = updateProviderDto.paymentCustomerId;
    }

    if (updateProviderDto.subscriptionId) {
      provider.subscriptionId = updateProviderDto.subscriptionId;
    }

    this.logger.log(
      `Attempting to save provider ${providerId} with final status: ${provider.status}`,
    );
    try {
      const updated = await this.providerRepository.save(provider);
      this.logger.log(
        `Provider ${providerId} saved successfully with status ${updated.status}.`,
      );
      return updated;
    } catch (saveError) {
      this.logger.error(
        `Error SAVING provider ${providerId}:`,
        saveError.stack ?? saveError.message,
      );
      throw saveError;
    }
  }

  async checkProviderOwnership({
    providerId,
    userId,
  }: {
    providerId: string;
    userId: string;
  }) {
    this.logger.log(
      `checkProviderOwnership: Checking if user ${userId} owns provider ${providerId}`,
    );
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile || user.providerProfile.id !== providerId) {
      this.logger.warn(
        `checkProviderOwnership: User ${userId} does NOT own provider ${providerId}. User providerProfile ID: ${user.providerProfile?.id}`,
      );
      throw new UnauthorizedException('Not your provider profile');
    }

    const provider = await this.findOneByOrFail({ id: providerId });
    this.logger.log(
      `checkProviderOwnership: Ownership confirmed for user ${userId} and provider ${providerId}`,
    );
    return provider;
  }

  async remove({ providerId, userId }: { providerId: string; userId: string }) {
    const provider = await this.checkProviderOwnership({
      providerId,
      userId,
    });
    await this.providerRepository.remove(provider);

    return provider;
  }

  async createProviderConnection({ userId }: { userId: string }) {
    const user = await this.userService.findOneByOrFail({ id: userId });
    if (!user.providerProfile) {
      throw new BadRequestException('User does not have a provider profile.');
    }

    let provider = user.providerProfile;

    if (!provider.providerPaymentId) {
      const newAccount =
        await this.gatewayPaymentService.createConnectedAccount({
          email: user.email,
        });
      provider.providerPaymentId = newAccount.id;
      provider = await this.providerRepository.save(provider);
    }

    const refreshUrl =
      this.configService.get<string>('STRIPE_ONBOARDING_REFRESH_URL') ?? '';
    const returnUrl =
      this.configService.get<string>('STRIPE_ONBOARDING_RETURN_URL') ?? '';

    const accountLink = await this.gatewayPaymentService.createAccountLink(
      provider.providerPaymentId!,
      refreshUrl,
      returnUrl,
    );

    return accountLink;
  }

  async getServices({
    userId,
    query,
    isActive,
  }: {
    userId: string;
    query?: string;
    isActive?: boolean;
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });
    if (!user.providerProfile) {
      throw new BadRequestException('User does not have a provider profile.');
    }

    const provider = user.providerProfile;

    const services = await this.servicesService.findAllByProvider({
      providerId: provider.id,
      query,
      isActive,
    });

    return services;
  }

  async getEnrollments({ userId }: { userId: string }) {
    const user = await this.userService.findOneByOrFail({ id: userId });
    if (!user.providerProfile) {
      throw new BadRequestException('User does not have a provider profile.');
    }

    const provider = user.providerProfile;

    const enrollments = await this.enrollmentsService.findAllByProvider({
      providerId: provider.id,
    });

    return enrollments;
  }
}
