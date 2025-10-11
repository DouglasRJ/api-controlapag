import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) {}

  async findOneByOrFail(
    providerData: Partial<Provider>,
    getEnrollments = false,
  ) {
    const provider = await this.providerRepository.findOne({
      where: providerData,
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
}
