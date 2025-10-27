export interface Customer {
  id: string;
}
export interface Balance {
  available: number;
  pending: number;
}

export interface Payout {
  id: string;
  amount: number;
  arrival_date: Date;
  status: string;
}
