import { ClientMetricsDto } from './client-metrics.dto';

export class OperationalMetricsDto {
  monthlyRevenue: number;
  activeEnrollments: number;
  clientMetrics: ClientMetricsDto;
  weeklyGrowth: number;
}
