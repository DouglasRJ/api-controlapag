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
import { ChargeService } from './charge.service';
import { ChargeResponseDto } from './dto/charge-response.dto';
import { CreateChargeDto } from './dto/create-charge.dto';
import { CreateManualChargeDto } from './dto/create-manual-charge.dto';
import { RefundChargeDto } from './dto/refund-charge.dto';
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

  @UseGuards(AuthGuard('jwt'))
  @Post('manual')
  async createManualCharge(
    @Req() req: AuthenticatedRequest,
    @Body() createManualChargeDto: CreateManualChargeDto,
  ) {
    const charge = await this.chargeService.createManualCharge(
      req.user,
      createManualChargeDto,
    );
    return new ChargeResponseDto(charge);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/refund')
  async refund(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() refundChargeDto?: RefundChargeDto,
  ) {
    const charge = await this.chargeService.refund(
      id,
      req.user,
      refundChargeDto,
    );
    return new ChargeResponseDto(charge);
  }
}
