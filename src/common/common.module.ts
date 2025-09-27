import { Module } from '@nestjs/common';
import { BcryptHashService } from './hash/bcrypt-hash.service';
import { HashService } from './hash/hash.service';
import { ManageFileService } from './manageFile/manageFile.service';
import { S3Service } from './manageFile/s3-manageFile.service';

@Module({
  providers: [
    {
      provide: HashService,
      useClass: BcryptHashService,
    },
    {
      provide: ManageFileService,
      useClass: S3Service,
    },
  ],
  exports: [HashService, ManageFileService],
})
export class CommonModule {}
