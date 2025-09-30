import { Body, Controller, Post } from '@nestjs/common';
import { ClientResponseDto } from 'src/client/dto/client-response.dto';
import { CreateClientDto } from 'src/client/dto/create-client.dto';
import { CreateProviderDto } from 'src/provider/dto/create-provider.dto';
import { ProviderResponseDto } from 'src/provider/dto/provider-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login({ loginDto });
  }

  @Post('/register/provider')
  async createProvider(@Body() createProviderDto: CreateProviderDto) {
    const provider = await this.authService.createProvider({
      createUserDto: createProviderDto,
    });
    return new ProviderResponseDto(provider);
  }

  @Post('/register/client')
  async createClient(@Body() createClientDto: CreateClientDto) {
    const client = await this.authService.createClient({
      createUserDto: createClientDto,
    });
    return new ClientResponseDto(client);
  }
}
