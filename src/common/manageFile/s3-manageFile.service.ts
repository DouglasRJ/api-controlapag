import {
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManageFileService } from './manageFile.service';

@Injectable()
export class S3Service extends ManageFileService {
  private logger = new Logger(S3Service.name);
  private region: string;
  private s3: S3Client;

  constructor(private configService: ConfigService) {
    super();
    this.region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    this.s3 = new S3Client({
      region: this.region,
    });
  }

  async uploadFile(file: Express.Multer.File, key: string) {
    const S3_BUCKET = this.configService.get<string>('S3_BUCKET');

    const input: PutObjectCommandInput = {
      Body: file.buffer,
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: file.mimetype,
    };

    try {
      const response: PutObjectCommandOutput = await this.s3.send(
        new PutObjectCommand(input),
      );
      if (response.$metadata.httpStatusCode === 200) {
        return `https://${S3_BUCKET}.s3.${this.region}.amazonaws.com/${key}}`;
      }

      throw new BadRequestException('Image not saved to S3');
    } catch (err) {
      this.logger.error('Cannot save file inside S3', err);
      throw new BadRequestException('Image not saved to S3');
    }
  }
}
