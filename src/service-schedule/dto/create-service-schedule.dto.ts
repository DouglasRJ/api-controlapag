import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { SERVICE_FREQUENCY } from '../enum/service-frequency.enum';

export class CreateServiceScheduleSimpleDto {
  @IsEnum(SERVICE_FREQUENCY)
  frequency: SERVICE_FREQUENCY;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    // Valida HH:mm
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
