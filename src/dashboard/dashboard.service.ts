import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ChargeService } from 'src/charge/charge.service';
import { ClientService } from 'src/client/client.service';
import { GatewayPaymentService } from 'src/common/gatewayPayment/gateway-payment.service';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { UserService } from 'src/user/user.service';
import { FinancialSummaryDto } from './dto/financial-summary.dto';
import { OperationalMetricsDto } from './dto/operational-metrics.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly userService: UserService,
    private readonly gatewayPaymentService: GatewayPaymentService,
    private readonly chargeService: ChargeService,
    private readonly enrollmentService: EnrollmentsService,
    private readonly clientService: ClientService,
  ) {}

  async getFinancialSummary(userId: string): Promise<FinancialSummaryDto> {
    const user = await this.userService.findOneByOrFail({ id: userId });

    if (!user.providerProfile) {
      throw new UnauthorizedException('User is not a provider.');
    }

    const providerPaymentId = user.providerProfile.providerPaymentId;

    if (!providerPaymentId) {
      throw new BadRequestException(
        'Provider account is not connected to the payment gateway.',
      );
    }

    const [balance, payouts] = await Promise.all([
      this.gatewayPaymentService.getBalance(providerPaymentId),
      this.gatewayPaymentService.listPayouts(providerPaymentId),
    ]);

    return {
      balance,
      recentPayouts: payouts,
    };
  }

  async getOperationalMetrics(userId: string): Promise<OperationalMetricsDto> {
    const user = await this.userService.findOneByOrFail({ id: userId });
    if (!user.providerProfile) {
      throw new UnauthorizedException('User is not a provider.');
    }
    const providerId = user.providerProfile.id;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);

    const [
      monthlyRevenue,
      activeEnrollments,
      totalClients,
      newClients,
      weeklyGrowth,
    ] = await Promise.all([
      this.chargeService.getTotalRevenueForProviderInDateRange(
        providerId,
        startOfMonth,
        endOfMonth,
      ),
      this.enrollmentService.countActiveEnrollmentsForProvider(providerId),
      this.clientService.countTotalClientsForProvider(providerId),
      this.clientService.countNewClientsForProviderInDateRange(
        providerId,
        startOfMonth,
        endOfMonth,
      ),
      this.enrollmentService.countNewEnrollmentsForProviderInDateRange(
        providerId,
        startOfWeek,
        today,
      ),
    ]);

    return {
      monthlyRevenue,
      activeEnrollments,
      clientMetrics: {
        total: totalClients,
        newThisMonth: newClients,
      },
      weeklyGrowth,
    };
  }
}
