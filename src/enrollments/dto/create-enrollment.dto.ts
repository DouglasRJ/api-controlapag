import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  endDate?: Date;

  @IsString()
  @IsNotEmpty()
  serviceId: string;
}
