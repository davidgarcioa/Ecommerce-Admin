export type DailyMetricFormat = 'number' | 'currency' | 'percentage' | 'multiplier';
export type DailyMetricStatus = 'default' | 'positive' | 'warning' | 'critical';

export interface DailyMetric {
  readonly id: string;
  readonly title: string;
  readonly value: number;
  readonly formattedValue: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly format: DailyMetricFormat;
  readonly status: DailyMetricStatus;
}
