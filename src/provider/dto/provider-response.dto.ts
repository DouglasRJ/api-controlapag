import { ServiceResponseDto } from 'src/services/dto/service-response.dto';
import { Provider } from '../entities/provider.entity';
import { PROVIDER_STATUS } from '../enum/provider-status.enum';

export class ProviderResponseDto {
  readonly id: string;
  readonly title: string;
  readonly bio: string;
  readonly businessPhone: string;
  readonly status: PROVIDER_STATUS;
  readonly address: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly paymentCustomerId?: string;
  readonly subscriptionId?: string;

  readonly services?: ServiceResponseDto[];

  constructor(provider: Provider) {
    this.id = provider.id;
    this.title = provider.title;
    this.bio = provider.bio;
    this.businessPhone = provider.businessPhone;
    this.status = provider.status;
    this.address = provider.address;
    this.createdAt = provider.createdAt;
    this.updatedAt = provider.updatedAt;
    this.paymentCustomerId = provider.paymentCustomerId;
    this.subscriptionId = provider.subscriptionId;

    if (provider?.services?.length) {
      this.services = provider.services?.map(s => new ServiceResponseDto(s));
    }
  }
}
