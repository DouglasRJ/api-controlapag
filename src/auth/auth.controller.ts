import { Body, Controller, Post } from '@nestjs/common';
import { CreateProviderDto } from 'src/provider/dto/create-provider.dto';
import { ProviderResponseDto } from 'src/provider/dto/provider-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('/register/provider')
  async createProvider(@Body() createProviderDto: CreateProviderDto) {
    const provider = await this.authService.createProvider(createProviderDto);
    return new ProviderResponseDto(provider);
  }
}
