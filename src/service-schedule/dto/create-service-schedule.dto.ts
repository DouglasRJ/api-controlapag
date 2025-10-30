import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { SERVICE_FREQUENCY } from '../enum/service-frequency.enum';

export class CreateServiceScheduleSimpleDto {
  @IsEnum(SERVICE_FREQUENCY)
  frequency: SERVICE_FREQUENCY;

  @IsOptional()
  @IsArray()
  daysOfWeek?: number[];

  @IsOptional()
  dayOfMonth?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime deve estar no formato HH:mm',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime deve estar no formato HH:mm',
  })
  endTime?: string;
}
