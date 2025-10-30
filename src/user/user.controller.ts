import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { type AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);

    return new UserResponseDto(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('File is missing');
    }

    const user = await this.userService.uploadAvatar(req.user.id, file);
    return new UserResponseDto(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users.map(u => new UserResponseDto(u));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async findOne(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findOne(req.user.id);
    return new UserResponseDto(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async update(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.update(req.user.id, updateUserDto);
    return new UserResponseDto(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/password')
  async updatePassword(
    @Req() req: AuthenticatedRequest,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = await this.userService.updatePassword(
      req.user.id,
      updatePasswordDto,
    );
    return new UserResponseDto(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  async remove(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.remove(req.user.id);
    return new UserResponseDto(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async removeById(@Param('id') id: string) {
    const user = await this.userService.remove(id);
    return new UserResponseDto(user);
  }
}
