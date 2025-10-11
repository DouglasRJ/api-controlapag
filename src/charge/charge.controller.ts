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
import { ChargeService } from './charge.service';
import { ChargeResponseDto } from './dto/charge-response.dto';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';

@Controller('charge')
export class ChargeController {
  constructor(private readonly chargeService: ChargeService) {}
  @Get()
  async findAll() {
    const charges = await this.chargeService.findAll();
    return charges.map(p => new ChargeResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const charges = await this.chargeService.findOne({ id });
    return new ChargeResponseDto(charges);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':enrollmentId')
  async create(
    @Body() createChargeDto: CreateChargeDto,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const charges = await this.chargeService.create({
      createChargeDto,
      enrollmentId,
    });
    return new ChargeResponseDto(charges);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChargeDto: UpdateChargeDto,
  ) {
    const charges = await this.chargeService.update({
      chargeId: id,
      updateChargeDto,
    });
    return new ChargeResponseDto(charges);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const charges = await this.chargeService.remove({
      chargeId: id,
    });
    return new ChargeResponseDto(charges);
  }
}
