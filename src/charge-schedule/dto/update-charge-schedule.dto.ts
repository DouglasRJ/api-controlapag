import { PartialType } from '@nestjs/mapped-types';
import { CreateChargeScheduleDto } from './create-charge-schedule.dto';

export class UpdateChargeScheduleDto extends PartialType(CreateChargeScheduleDto) {}
