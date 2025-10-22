import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceScheduleDto } from './create-service-schedule.dto';

export class UpdateServiceScheduleDto extends PartialType(CreateServiceScheduleDto) {}
