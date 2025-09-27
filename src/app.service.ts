import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  version(): { version: string } {
    return {
      version: '0.0.1',
    };
  }
}
