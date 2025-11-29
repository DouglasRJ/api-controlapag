import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteSubProviderDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
