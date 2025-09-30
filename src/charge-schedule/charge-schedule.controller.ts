import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChargeScheduleService } from './charge-schedule.service';
import { ChargeScheduleResponseDto } from './dto/charge-schedule-response.dto';
import { CreateChargeScheduleDto } from './dto/create-charge-schedule.dto';
import { UpdateChargeScheduleDto } from './dto/update-charge-schedule.dto';

@Controller('charge-schedule')
export class ChargeScheduleController {
  constructor(private readonly chargeScheduleService: ChargeScheduleService) {}
  @Get()
  async findAll() {
    const chargesSchedules = await this.chargeScheduleService.findAll();
    return chargesSchedules.map(p => new ChargeScheduleResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const chargesSchedules = await this.chargeScheduleService.findOne({ id });
    return new ChargeScheduleResponseDto(chargesSchedules);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':enrollmentId')
  async create(
    @Body() createChargeScheduleDto: CreateChargeScheduleDto,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const chargesSchedules = await this.chargeScheduleService.create({
      createChargeScheduleDto,
      enrollmentId,
    });
    return new ChargeScheduleResponseDto(chargesSchedules);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChargeScheduleDto: UpdateChargeScheduleDto,
  ) {
    const chargesSchedules = await this.chargeScheduleService.update({
      chargeScheduleId: id,
      updateChargeScheduleDto,
    });
    return new ChargeScheduleResponseDto(chargesSchedules);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const chargesSchedules = await this.chargeScheduleService.remove({
      chargeScheduleId: id,
    });
    return new ChargeScheduleResponseDto(chargesSchedules);
  }
}
