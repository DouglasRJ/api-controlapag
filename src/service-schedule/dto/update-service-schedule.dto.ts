import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceScheduleSimpleDto } from './create-service-schedule.dto';

export class UpdateServiceScheduleDto extends PartialType(
  CreateServiceScheduleSimpleDto,
) {}
