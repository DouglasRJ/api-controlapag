import { EnrollmentsResponseDto } from 'src/enrollments/dto/enrollments-response.dto';
import { Service } from '../entities/service.entity';

export class ServiceResponseDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly defaultPrice?: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  readonly providerId?: string;

  readonly enrollments?: EnrollmentsResponseDto[];

  constructor(service: Service) {
    this.id = service.id;
    this.name = service.name;
    this.description = service.description;
    this.defaultPrice = service.defaultPrice;
    this.isActive = service.isActive;
    this.createdAt = service.createdAt;
    this.updatedAt = service.updatedAt;

    if (service.enrollments) {
      this.enrollments = service.enrollments.map(
        e => new EnrollmentsResponseDto(e),
      );
    }

    if (service.provider) {
      this.providerId = service.provider.id;
    }
  }
}
