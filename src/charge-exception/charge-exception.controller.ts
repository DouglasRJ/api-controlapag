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
import { ChargeExceptionService } from './charge-exception.service';
import { ChargeExceptionResponseDto } from './dto/charge-exception-response.dto';
import { CreateChargeExceptionDto } from './dto/create-charge-exception.dto';
import { UpdateChargeExceptionDto } from './dto/update-charge-exception.dto';

@Controller('charge-exception')
export class ChargeExceptionController {
  constructor(
    private readonly chargeExceptionService: ChargeExceptionService,
  ) {}
  @Get()
  async findAll() {
    const chargesExceptions = await this.chargeExceptionService.findAll();
    return chargesExceptions.map(p => new ChargeExceptionResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const chargesExceptions = await this.chargeExceptionService.findOne({ id });
    return new ChargeExceptionResponseDto(chargesExceptions);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':enrollmentId')
  async create(
    @Body() createChargeExceptionDto: CreateChargeExceptionDto,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const chargesExceptions = await this.chargeExceptionService.create({
      createChargeExceptionDto,
      enrollmentId,
    });
    return new ChargeExceptionResponseDto(chargesExceptions);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChargeExceptionDto: UpdateChargeExceptionDto,
  ) {
    const chargesExceptions = await this.chargeExceptionService.update({
      chargeExceptionId: id,
      updateChargeExceptionDto,
    });
    return new ChargeExceptionResponseDto(chargesExceptions);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const chargesExceptions = await this.chargeExceptionService.remove({
      chargeExceptionId: id,
    });
    return new ChargeExceptionResponseDto(chargesExceptions);
  }
}
