import { Carrier, OrderStatus } from './daily-order.model';

export type DailyReportPeriod = 'today' | 'yesterday' | 'last-7-days' | 'last-30-days' | 'custom';

export interface DailyReportFilter {
  readonly date: string;
  readonly period: DailyReportPeriod;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly productGroupId: string;
  readonly orderStatus: OrderStatus | 'Todos';
  readonly carrier: Carrier | 'Todas';
  readonly city: string;
}
