import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashService } from 'src/common/hash/hash.service';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const error = new UnauthorizedException('Email or Password incorrect');

    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw error;
    }

    const isPasswordCorrect = await this.hashService.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw error;
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return {
      accessToken,
    };
  }
}
