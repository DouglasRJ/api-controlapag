import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PAYMENT_METHOD } from '../enum/payment-method.enum';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  defaultPrice?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsEnum(PAYMENT_METHOD, { each: true })
  @IsOptional()
  allowedPaymentMethods?: PAYMENT_METHOD[];
}
