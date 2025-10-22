import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { SERVICE_FREQUENCY } from '../enum/service-frequency.enum';

export class CreateServiceScheduleDto {
  @IsEnum(SERVICE_FREQUENCY)
  @IsNotEmpty()
  frequency: SERVICE_FREQUENCY;

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @ValidateIf(
    (o: CreateServiceScheduleDto) => o.frequency === SERVICE_FREQUENCY.WEEKLY,
  )
  @IsNotEmpty({ message: 'daysOfWeek é obrigatório para frequência WEEKLY' })
  daysOfWeek?: number[];

  @IsInt()
  @Min(1)
  @Max(31)
  @ValidateIf(
    (o: CreateServiceScheduleDto) => o.frequency === SERVICE_FREQUENCY.MONTHLY,
  )
  @IsNotEmpty({ message: 'dayOfMonth é obrigatório para frequência MONTHLY' })
  dayOfMonth?: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'startTime deve estar no formato HH:MM:SS',
  })
  @IsOptional()
  startTime?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'endTime deve estar no formato HH:MM:SS',
  })
  @IsOptional()
  endTime?: string;
}
