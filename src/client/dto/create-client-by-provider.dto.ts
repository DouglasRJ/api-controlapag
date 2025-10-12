import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateClientByProviderDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
