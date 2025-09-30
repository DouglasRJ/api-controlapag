import { Service } from '../entities/service.entity';

export class ServiceResponseDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly defaultPrice?: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(service: Service) {
    this.id = service.id;
    this.name = service.name;
    this.description = service.description;
    this.defaultPrice = service.defaultPrice;
    this.isActive = service.isActive;
    this.createdAt = service.createdAt;
    this.updatedAt = service.updatedAt;
  }
}
