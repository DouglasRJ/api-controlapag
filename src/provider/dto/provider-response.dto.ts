import { Provider } from '../entities/provider.entity';
import { PROVIDER_STATUS } from '../enum/provider-status.enum';

export class ProviderResponseDto {
  readonly providerId: string;
  readonly title: string;
  readonly bio: string;
  readonly businessPhone: string;
  readonly status: PROVIDER_STATUS;
  readonly address: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(provider: Provider) {
    this.providerId = provider.id;
    this.title = provider.title;
    this.bio = provider.bio;
    this.businessPhone = provider.businessPhone;
    this.status = provider.status;
    this.address = provider.address;
    this.createdAt = provider.createdAt;
    this.updatedAt = provider.updatedAt;
  }
}
