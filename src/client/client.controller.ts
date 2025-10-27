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
import { ClientService } from './client.service';
import { ClientResponseDto } from './dto/client-response.dto';
import { CreateClientByProviderResponseDto } from './dto/create-client-by-provider-response.dto';
import { CreateClientByProviderDto } from './dto/create-client-by-provider.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Query('search') search: string) {
    const clients = await this.clientService.findAll(search);
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

  @UseGuards(AuthGuard('jwt'))
  @Post('register-by-provider')
  async createByProvider(
    @Req() req: AuthenticatedRequest,
    @Body() createClientDto: CreateClientByProviderDto,
  ) {
    const data = await this.clientService.createClientByProvider({
      providerUserId: req.user.id,
      createClientDto,
    });
    return new CreateClientByProviderResponseDto(data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('enrollments')
  async findClientEnrollments(@Req() req: AuthenticatedRequest) {
    const enrollments = await this.clientService.findClientEnrollments({
      userId: req.user.id,
    });
    return enrollments.map(e => new EnrollmentsResponseDto(e));
  }
}
