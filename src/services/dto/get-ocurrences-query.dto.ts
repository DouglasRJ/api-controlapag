import { IsISO8601 } from 'class-validator';

export class GetOccurrencesQueryDto {
  @IsISO8601(
    { strict: true },
    { message: 'Formato inválido para startDate. Use YYYY-MM-DD.' },
  )
  startDate: Date;

  @IsISO8601(
    { strict: true },
    { message: 'Formato inválido para endDate. Use YYYY-MM-DD.' },
  )
  endDate: Date;
}
