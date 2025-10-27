import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class SetInitialPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message: `A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.`,
    },
  )
  newPassword: string;
}
