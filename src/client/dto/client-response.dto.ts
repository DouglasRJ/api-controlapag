import { Client } from '../entities/client.entity';

export class ClientResponseDto {
  readonly id: string;
  readonly phone: string;
  readonly address: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(client: Client) {
    this.id = client.id;
    this.phone = client.phone;
    this.address = client.address;
    this.createdAt = client.createdAt;
    this.updatedAt = client.updatedAt;
  }
}
