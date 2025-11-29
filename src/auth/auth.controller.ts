import { Body, Controller, Post } from '@nestjs/common';
import { ClientResponseDto } from 'src/client/dto/client-response.dto';
import { CreateClientDto } from 'src/client/dto/create-client.dto';
import { CreateProviderDto } from 'src/provider/dto/create-provider.dto';
import { ProviderResponseDto } from 'src/provider/dto/provider-response.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetInitialPasswordDto } from './dto/set-initial-password.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login({ loginDto });
  }

  @Post('/register/provider')
  async createProvider(@Body() createProviderDto: CreateProviderDto) {
    const { user, provider, accessToken } =
      await this.authService.createProvider({
        createUserDto: createProviderDto,
      });
    return {
      user: new UserResponseDto(user),
      provider: new ProviderResponseDto(provider),
      accessToken,
    };
  }

  @Post('/register/client')
  async createClient(@Body() createClientDto: CreateClientDto) {
    const { user, client, accessToken } = await this.authService.createClient({
      createUserDto: createClientDto,
    });
    return {
      user: new UserResponseDto(user),
      client: new ClientResponseDto(client),
      accessToken,
    };
  }

  @Post('set-initial-password')
  async setInitialPassword(
    @Body() setInitialPasswordDto: SetInitialPasswordDto,
  ) {
    const user = await this.authService.setInitialPassword(
      setInitialPasswordDto,
    );
    return new UserResponseDto(user);
  }

  @Post('accept-invite')
  async acceptInvite(@Body() acceptInviteDto: AcceptInviteDto) {
    const { user, provider, accessToken } = await this.authService.acceptInvite(
      {
        token: acceptInviteDto.token,
        organizationId: acceptInviteDto.organizationId,
        username: acceptInviteDto.username,
        password: acceptInviteDto.password,
        email: acceptInviteDto.email,
      },
    );
    return {
      user: new UserResponseDto(user),
      provider: new ProviderResponseDto(provider),
      accessToken,
    };
  }
}
