import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { DashboardService } from './dashboard.service';
import { FinancialSummaryDto } from './dto/financial-summary.dto';
import { OperationalMetricsDto } from './dto/operational-metrics.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('financial-summary')
  async getFinancialSummary(@Req() req: AuthenticatedRequest) {
    const data = await this.dashboardService.getFinancialSummary(req.user.id);
    return new FinancialSummaryDto(data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('operational-metrics')
  async getOperationalMetrics(
    @Req() req: AuthenticatedRequest,
  ): Promise<OperationalMetricsDto> {
    return this.dashboardService.getOperationalMetrics(req.user.id);
  }
}
