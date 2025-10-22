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
import { CreateServiceScheduleDto } from './dto/create-serviceSchedules.dto';
import { ServiceScheduleResponseDto } from './dto/serviceSchedules-response.dto';
import { UpdateServiceScheduleDto } from './dto/update-serviceSchedules.dto';
import { ServiceScheduleSchedulesServiceSchedule } from './servicesSchedules.serviceSchedules';

@Controller('serviceSchedules')
export class ServiceScheduleSchedulesController {
  constructor(
    private readonly servicesServiceSchedule: ServiceScheduleSchedulesServiceSchedule,
  ) {}
  @Get()
  async findAll() {
    const servicesSchedules = await this.servicesServiceSchedule.findAll();
    return servicesSchedules.map(p => new ServiceScheduleResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const serviceSchedules = await this.servicesServiceSchedule.findOne({ id });
    return new ServiceScheduleResponseDto(serviceSchedules);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createServiceScheduleDto: CreateServiceScheduleDto,
  ) {
    const serviceSchedules = await this.servicesServiceSchedule.create({
      userId: req.user.id,
      createServiceScheduleDto,
    });
    return new ServiceScheduleResponseDto(serviceSchedules);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateServiceScheduleDto: UpdateServiceScheduleDto,
  ) {
    const serviceSchedules = await this.servicesServiceSchedule.update({
      serviceId: id,
      userId: req.user.id,
      updateServiceScheduleDto,
    });
    return new ServiceScheduleResponseDto(serviceSchedules);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const serviceSchedules = await this.servicesServiceSchedule.remove({
      userId: req.user.id,
      serviceId: id,
    });
    return new ServiceScheduleResponseDto(serviceSchedules);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('search')
  async search(@Query('q') query: string) {
    console.log('query', query);
    const servicesSchedules =
      await this.servicesServiceSchedule.searchServiceScheduleSchedules(query);
    return servicesSchedules.map(p => new ServiceScheduleResponseDto(p));
  }
}
