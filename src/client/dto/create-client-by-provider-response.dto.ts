import { Client } from '../entities/client.entity';
import { ClientResponseDto } from './client-response.dto';

export class CreateClientByProviderResponseDto {
  client: ClientResponseDto;
  passwordSetupToken: string;

  constructor(data: { client: Client; passwordSetupToken: string }) {
    this.client = new ClientResponseDto(data.client);
    this.passwordSetupToken = data.passwordSetupToken;
  }
}
