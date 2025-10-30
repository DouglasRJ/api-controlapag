import { PartialType } from '@nestjs/mapped-types';
import { CreateChargeExceptionDto } from './create-charge-exception.dto';

export class UpdateChargeExceptionDto extends PartialType(
  CreateChargeExceptionDto,
) {}
