import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from 'src/common/email/email.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { EntityManager, Repository } from 'typeorm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteSubProviderDto } from './dto/invite-sub-provider.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { randomBytes } from 'crypto';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
    transactionalEntityManager?: EntityManager,
  ): Promise<Organization> {
    // Verificar se o owner existe e é um PROVIDER ou MASTER
    // Se estiver em uma transação, buscar usando o transactionalEntityManager
    let owner;
    if (transactionalEntityManager) {
      owner = await transactionalEntityManager.findOne(User, {
        where: { id: createOrganizationDto.ownerId },
      });
      if (!owner) {
        throw new NotFoundException('User not found');
      }
    } else {
      owner = await this.userService.findOneByOrFail({
        id: createOrganizationDto.ownerId,
      });
    }

    if (
      owner.role !== USER_ROLE.PROVIDER &&
      owner.role !== USER_ROLE.MASTER
    ) {
      throw new BadRequestException(
        'Only users with PROVIDER or MASTER role can create organizations',
      );
    }

    const organization = transactionalEntityManager
      ? transactionalEntityManager.create(Organization, createOrganizationDto)
      : this.organizationRepository.create(createOrganizationDto);

    const savedOrganization = transactionalEntityManager
      ? await transactionalEntityManager.save(organization)
      : await this.organizationRepository.save(organization);

    // Associar o owner à organization
    owner.organizationId = savedOrganization.id;
    if (transactionalEntityManager) {
      await transactionalEntityManager.save(owner);
    } else {
      await this.userService.save(owner);
    }

    return savedOrganization;
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: [],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async findOneByOwnerId(ownerId: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { ownerId },
    });
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    const organization = await this.findOne(id);

    // Verificar se o usuário é o owner
    const user = await this.userService.findOneByOrFail({ id: userId });
    if (organization.ownerId !== userId && user.organizationId !== id) {
      throw new UnauthorizedException(
        'Only the organization owner can update the organization',
      );
    }

    if (updateOrganizationDto.name) {
      organization.name = updateOrganizationDto.name;
    }

    return this.organizationRepository.save(organization);
  }

  async inviteSubProvider(
    organizationId: string,
    inviteSubProviderDto: InviteSubProviderDto,
    inviterUserId: string,
  ): Promise<void> {
    const organization = await this.findOne(organizationId);

    // Verificar se o usuário que está convidando tem permissão
    const inviter = await this.userService.findOneByOrFail({
      id: inviterUserId,
    });

    if (organization.ownerId !== inviterUserId) {
      throw new UnauthorizedException(
        'Only the organization owner can invite sub-providers',
      );
    }

    // Verificar se o email já existe
    try {
      const existingUser = await this.userService.findOneByOrFail({
        email: inviteSubProviderDto.email,
      });
      if (existingUser.organizationId === organizationId) {
        throw new BadRequestException(
          'User is already part of this organization',
        );
      }
      // Se o usuário existe mas não está na org, podemos adicionar (implementação futura)
      throw new BadRequestException(
        'User already exists. Adding existing users to organizations is not yet implemented.',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Usuário não existe, podemos continuar com o convite
      } else {
        throw error;
      }
    }

    // Criar token de convite
    const inviteToken = randomBytes(32).toString('hex');
    const jwtPayload: JwtPayload = {
      sub: inviteToken,
      email: inviteSubProviderDto.email,
    };

    const inviteJwtToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: '7d',
    });

    // TODO: Salvar convite em uma tabela de convites pendentes (implementação futura)
    // Por enquanto, vamos apenas enviar o email com o token

    // Enviar email de convite
    const inviteUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:8081'}/accept-invite?token=${inviteJwtToken}&organizationId=${organizationId}`;

    try {
      await this.emailService.sendEmail({
        to: inviteSubProviderDto.email,
        subject: `Convite para ${organization.name} - ControlaPAG`,
        html: `
          <h1>Você foi convidado!</h1>
          <p>Olá ${inviteSubProviderDto.name},</p>
          <p>Você foi convidado a se juntar à organização <strong>${organization.name}</strong> como Sub-Provider.</p>
          <p>Clique no link abaixo para aceitar o convite e criar sua conta:</p>
          <p><a href="${inviteUrl}">Aceitar Convite</a></p>
          <p>Este link é válido por 7 dias.</p>
          <p>Se você não esperava este convite, pode ignorar este email.</p>
        `,
      });

      this.logger.log(
        `Invite email sent to ${inviteSubProviderDto.email} for organization ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send invite email to ${inviteSubProviderDto.email}`,
        error,
      );
      throw new BadRequestException(
        'Failed to send invite email. Please try again.',
      );
    }
  }

  async save(organization: Organization): Promise<Organization> {
    return this.organizationRepository.save(organization);
  }
}
