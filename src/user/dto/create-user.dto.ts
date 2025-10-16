import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { USER_ROLE } from '../enum/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      // minUppercase: 1,
      // minLowercase: 1,
      // minNumbers: 1,
      // minSymbols: 1,
    },
    // {
    //   message: `Password must contain Minimum 8 and maximum 20 characters,
    // at least one uppercase letter,
    // one lowercase letter,
    // one number and
    // one special character`,
    // },
    {
      message: `A senha deve ter no mínimo 8 caracteres`,
    },
  )
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsEnum(USER_ROLE)
  role: USER_ROLE;
}
