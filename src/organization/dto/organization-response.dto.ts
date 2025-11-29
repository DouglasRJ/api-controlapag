import { Organization } from '../entities/organization.entity';

export class OrganizationResponseDto {
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(organization: Organization) {
    this.id = organization.id;
    this.name = organization.name;
    this.ownerId = organization.ownerId;
    this.createdAt = organization.createdAt;
    this.updatedAt = organization.updatedAt;
  }
}
