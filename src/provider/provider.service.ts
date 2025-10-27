import {
  BadRequestException,
  Injectable,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const provider = await this.checkProviderOwnership({
      providerId,
      userId,
    });

    provider.title = updateProviderDto.title ?? provider.title;
    provider.address = updateProviderDto.address ?? provider.address;
    provider.bio = updateProviderDto.bio ?? provider.bio;
    provider.businessPhone =
      updateProviderDto.businessPhone ?? provider.businessPhone;
    provider.status = updateProviderDto.status ?? provider.status;
    provider.providerPaymentId = updateProviderDto.providerPaymentId;

    if (updateProviderDto.paymentCustomerId) {
      provider.paymentCustomerId = updateProviderDto.paymentCustomerId;
    }

    if (updateProviderDto.subscriptionId) {
      provider.subscriptionId = updateProviderDto.subscriptionId;
    }

    const updated = await this.providerRepository.save(provider);

    return updated;
  }

  async remove({ providerId, userId }: { providerId: string; userId: string }) {
    const provider = await this.checkProviderOwnership({
      providerId,
      userId,
    });
    await this.providerRepository.remove(provider);

    return provider;
  }

  async checkProviderOwnership({
    providerId,
    userId,
  }: {
    providerId: string;
    userId: string;
  }) {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile || user.providerProfile.id !== providerId) {
      throw new UnauthorizedException('Not your provider profile');
    }

    const provider = await this.findOneByOrFail({ id: providerId });

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
