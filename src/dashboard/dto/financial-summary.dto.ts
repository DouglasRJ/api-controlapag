import { Balance, Payout } from 'src/common/gatewayPayment/types/gateway.dtos';

export class FinancialSummaryDto {
  readonly balance: Balance;
  readonly recentPayouts: Payout[];

  constructor(data: { balance: Balance; recentPayouts: Payout[] }) {
    this.balance = data.balance;
    this.recentPayouts = data.recentPayouts;
  }
}
