import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { ClientService } from './client.service';
import { ClientResponseDto } from './dto/client-response.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    const clients = await this.clientService.findAll();
    return clients.map(p => new ClientResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async findOne(@Req() req: AuthenticatedRequest) {
    const client = await this.clientService.findOne({ userId: req.user.id });
    return new ClientResponseDto(client);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const client = await this.clientService.update({
      clientId: id,
      userId: req.user.id,
      updateClientDto,
    });
    return new ClientResponseDto(client);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const client = await this.clientService.remove({
      userId: req.user.id,
      clientId: id,
    });
    return new ClientResponseDto(client);
  }
}
