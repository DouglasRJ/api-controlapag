import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@Controller('service')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}
  @Get()
  async findAll() {
    const services = await this.servicesService.findAll();
    return services.map(p => new ServiceResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const service = await this.servicesService.findOne(id);
    return new ServiceResponseDto(service);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    const service = await this.servicesService.create(
      req.user.id,
      createServiceDto,
    );
    return new ServiceResponseDto(service);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.servicesService.update(
      id,
      req.user.id,
      updateServiceDto,
    );
    return new ServiceResponseDto(service);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const service = await this.servicesService.remove(req.user.id, id);
    return new ServiceResponseDto(service);
  }
}
