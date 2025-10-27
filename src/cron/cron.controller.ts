import { Controller } from '@nestjs/common';

@Controller('cron')
export class CronController {
  private readonly internalApiToken: string;

  // constructor(private readonly cronService: CronService) {
  //   const api_token = process.env.INTERNAL_API_TOKEN;
  //   if (!api_token) {
  //     throw new InternalServerErrorException(
  //       'INTERNAL_API_TOKEN is not defined in environment variables.',
  //     );
  //   }
  //   this.internalApiToken = api_token;
  // }

  // @Post('create-daily-charges')
  // async createDailyCharges(@Headers('x-internal-api-token') token: string) {
  //   if (token !== this.internalApiToken) {
  //     throw new UnauthorizedException('Invalid internal API token.');
  //   }
  //   return this.cronService.createDailyCharges();
  // }
}
