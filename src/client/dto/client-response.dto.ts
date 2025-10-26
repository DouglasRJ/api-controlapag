import { EnrollmentsResponseDto } from 'src/enrollments/dto/enrollments-response.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { Client } from '../entities/client.entity';

export class ClientResponseDto {
  readonly id: string;
  readonly phone: string;
  readonly address: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user: UserResponseDto;

  readonly enrollments?: EnrollmentsResponseDto[];

  constructor(client: Client) {
    this.id = client.id;
    this.phone = client.phone;
    this.address = client.address;
    this.createdAt = client.createdAt;
    this.updatedAt = client.updatedAt;

    if (client.user) {
      this.user = new UserResponseDto(client.user);
    }

    if (client.enrollments) {
      this.enrollments = client.enrollments.map(
        enrollment => new EnrollmentsResponseDto(enrollment),
      );
    }
  }
}
