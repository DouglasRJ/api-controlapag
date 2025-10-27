import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { PROVIDER_STATUS } from '../enum/provider-status.enum';

export class CreateProviderDto extends CreateUserDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsString()
  @IsNotEmpty()
  businessPhone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  paymentCustomerId?: string;

  @IsString()
  @IsOptional()
  subscriptionId?: string;

  @IsEnum({
    enum: PROVIDER_STATUS,
  })
  @IsOptional()
  status?: PROVIDER_STATUS;

  @IsOptional()
  @IsString()
  providerPaymentId: string;
}
