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
  private readonly logger = new Logger(ProviderService.name); // Adicione esta linha se não existir

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
    userId, // Este userId vem do handleAccountUpdated
    updateProviderDto,
  }: {
    providerId: string;
    userId: string;
    updateProviderDto: UpdateProviderDto;
  }) {
    // Log ANTES de checkProviderOwnership
    this.logger.log(
      `ProviderService 'update' called for providerId: ${providerId} by (alleged) userId: ${userId}. DTO: ${JSON.stringify(updateProviderDto)}`,
    );

    let provider: Provider;
    try {
      // *** O PROBLEMA DEVE ESTAR AQUI DENTRO QUANDO CHAMADO PELO WEBHOOK ***
      provider = await this.checkProviderOwnership({
        providerId,
        userId, // A validação aqui provavelmente falha no contexto do webhook
      });
      // Log APÓS checkProviderOwnership (se passar)
      this.logger.log(
        `checkProviderOwnership passed successfully for providerId: ${providerId} and userId: ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `checkProviderOwnership FAILED for providerId: ${providerId} and userId: ${userId}. Error: ${error.message}`,
      );
      // Re-lança o erro para ser pego pelo catch do handleAccountUpdated
      throw error;
    }

    // Aplica as atualizações do DTO
    provider.title = updateProviderDto.title ?? provider.title;
    provider.address = updateProviderDto.address ?? provider.address;
    provider.bio = updateProviderDto.bio ?? provider.bio;
    provider.businessPhone =
      updateProviderDto.businessPhone ?? provider.businessPhone;

    // Aplica a atualização de status vinda do DTO
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

    // Não atualize providerPaymentId via DTO neste fluxo geralmente,
    // mas se precisar, logue:
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

    // Log antes de salvar
    this.logger.log(
      `Attempting to save provider ${providerId} with final status: ${provider.status}`,
    );
    try {
      const updated = await this.providerRepository.save(provider);
      // Log após salvar
      this.logger.log(
        `Provider ${providerId} saved successfully with status ${updated.status}.`,
      );
      return updated;
    } catch (saveError) {
      this.logger.error(
        `Error SAVING provider ${providerId}:`,
        saveError.stack ?? saveError.message,
      );
      throw saveError; // Re-lança para o catch externo
    }
  }

  async checkProviderOwnership({
    providerId,
    userId,
  }: {
    providerId: string;
    userId: string;
  }) {
    // Log no início da checagem
    this.logger.log(
      `checkProviderOwnership: Checking if user ${userId} owns provider ${providerId}`,
    );
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile || user.providerProfile.id !== providerId) {
      // Log antes de lançar a exceção
      this.logger.warn(
        `checkProviderOwnership: User ${userId} does NOT own provider ${providerId}. User providerProfile ID: ${user.providerProfile?.id}`,
      );
      throw new UnauthorizedException('Not your provider profile');
    }

    // Busca o provider novamente para garantir que está completo (findOneByOrFail pode não carregar tudo)
    // Ou pode simplesmente retornar o provider já carregado pelo `user` se as relações estiverem corretas
    // Ajuste conforme sua necessidade, mas o importante é a validação acima.
    const provider = await this.findOneByOrFail({ id: providerId }); // Use o findOneByOrFail que já busca relações necessárias
    this.logger.log(
      `checkProviderOwnership: Ownership confirmed for user ${userId} and provider ${providerId}`,
    );
    return provider; // Retorna o provider encontrado
  }

  async remove({ providerId, userId }: { providerId: string; userId: string }) {
    const provider = await this.checkProviderOwnership({
      providerId,
      userId,
    });
    await this.providerRepository.remove(provider);

    return provider;
  }

  // async checkProviderOwnership({
  //   providerId,
  //   userId,
  // }: {
  //   providerId: string;
  //   userId: string;
  // }) {
  //   const user = await this.userService.findOneByOrFail({ id: userId });

  //   if (!user.providerProfile || user.providerProfile.id !== providerId) {
  //     throw new UnauthorizedException('Not your provider profile');
  //   }

  //   const provider = await this.findOneByOrFail({ id: providerId });

  //   return provider;
  // }

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
