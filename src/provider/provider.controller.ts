import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { EnrollmentsResponseDto } from 'src/enrollments/dto/enrollments-response.dto';
import { ServiceResponseDto } from 'src/services/dto/service-response.dto';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { ProviderService } from './provider.service';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}
  @Get()
  async findAll() {
    const providers = await this.providerService.findAll();
    return providers.map(p => new ProviderResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async findOne(@Req() req: AuthenticatedRequest) {
    const provider = await this.providerService.findOne({
      userId: req.user.id,
    });
    return new ProviderResponseDto(provider);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    const provider = await this.providerService.update({
      providerId: id,
      userId: req.user.id,
      updateProviderDto,
    });
    return new ProviderResponseDto(provider);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const provider = await this.providerService.remove({
      providerId: id,
      userId: req.user.id,
    });
    return new ProviderResponseDto(provider);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('connect-account')
  async connectAccount(@Req() req: AuthenticatedRequest) {
    return this.providerService.createProviderConnection({
      userId: req.user.id,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('services')
  async getServices(
    @Req() req: AuthenticatedRequest,
    @Query('q') query?: string,
    @Query('isActive') isActive?: string,
  ) {
    let isActiveFilter: boolean | undefined;
    if (isActive === 'true') {
      isActiveFilter = true;
    } else if (isActive === 'false') {
      isActiveFilter = false;
    }

    const services = await this.providerService.getServices({
      userId: req.user.id,
      query,
      isActive: isActiveFilter,
    });
    return services.map(s => new ServiceResponseDto(s));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('enrollments')
  async getEnrollments(@Req() req: AuthenticatedRequest) {
    const enrollments = await this.providerService.getEnrollments({
      userId: req.user.id,
    });
    return enrollments.map(e => new EnrollmentsResponseDto(e));
  }
}
