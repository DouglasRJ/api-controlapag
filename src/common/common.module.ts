import { Module } from '@nestjs/common';
import { BcryptHashService } from './hash/bcrypt-hash.service';
import { HashService } from './hash/hash.service';

@Module({
  providers: [
    {
      provide: HashService,
      useClass: BcryptHashService,
    },
  ],
  exports: [HashService],
})
export class CommonModule {}
