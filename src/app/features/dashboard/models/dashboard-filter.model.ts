export type DashboardPeriod = 'today' | 'last-7-days' | 'last-30-days' | 'this-month';

export interface DashboardFilter {
  readonly productGroupId: string;
  readonly period: DashboardPeriod;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
}

export interface DashboardFilterOption {
  readonly label: string;
  readonly value: DashboardPeriod;
}
