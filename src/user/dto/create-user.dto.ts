import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { USER_ROLE } from '../enum/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsEnum(USER_ROLE)
  role: USER_ROLE;
}
