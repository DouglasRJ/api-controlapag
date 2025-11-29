import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { USER_ROLE } from 'src/user/enum/user-role.enum';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteSubProviderDto } from './dto/invite-sub-provider.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';

@Controller('organization')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @Roles(USER_ROLE.MASTER, USER_ROLE.PROVIDER, USER_ROLE.INDIVIDUAL)
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Verificar se o usuário já possui uma organização
    const existingOrganization = await this.organizationService.findOneByOwnerId(
      req.user.id,
    );

    if (existingOrganization) {
      throw new BadRequestException(
        'User already has an organization. Each user can only own one organization.',
      );
    }

    // Verificar se o usuário já está associado a uma organização
    if (req.user.organizationId) {
      throw new BadRequestException(
        'User is already associated with an organization. Cannot create a new one.',
      );
    }

    // O ownerId deve ser o usuário autenticado
    createOrganizationDto.ownerId = req.user.id;
    const organization = await this.organizationService.create(
      createOrganizationDto,
    );
    return new OrganizationResponseDto(organization);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const organization = await this.organizationService.findOne(id);

    // Verificar se o usuário pertence à organização
    const user = req.user;
    if (
      organization.ownerId !== user.id &&
      user.organizationId !== organization.id
    ) {
      throw new UnauthorizedException(
        'You do not have access to this organization',
      );
    }

    return new OrganizationResponseDto(organization);
  }

  @Patch(':id')
  @Roles(USER_ROLE.MASTER, USER_ROLE.SUB_PROVIDER)
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const organization = await this.organizationService.update(
      id,
      updateOrganizationDto,
      req.user.id,
    );
    return new OrganizationResponseDto(organization);
  }

  @Post(':id/invite-sub-provider')
  @Roles(USER_ROLE.MASTER)
  async inviteSubProvider(
    @Param('id') id: string,
    @Body() inviteSubProviderDto: InviteSubProviderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.organizationService.inviteSubProvider(
      id,
      inviteSubProviderDto,
      req.user.id,
    );
    return { message: 'Invite sent successfully' };
  }
}
