import { ClientResponseDto } from 'src/client/dto/client-response.dto';
import { ProviderResponseDto } from 'src/provider/dto/provider-response.dto';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly image: string;

  readonly providerProfile?: ProviderResponseDto;
  readonly clientProfile?: ClientResponseDto;

  constructor(user: User) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    if (user.image) {
      this.image = user.image;
    }

    if (user.providerProfile) {
      this.providerProfile = new ProviderResponseDto(user.providerProfile);
    }

    if (user.clientProfile) {
      this.clientProfile = new ClientResponseDto(user.clientProfile);
    }
  }
}
