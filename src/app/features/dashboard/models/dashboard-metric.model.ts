export type MetricFormat = 'number' | 'currency' | 'percentage' | 'multiplier';
export type MetricTrendDirection = 'up' | 'down' | 'neutral';
export type MetricStatus = 'default' | 'positive' | 'warning' | 'critical' | 'unavailable';

export interface DashboardMetric {
  readonly id: string;
  readonly title: string;
  readonly value: number;
  readonly formattedValue: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly trendValue: number | null;
  readonly trendDirection: MetricTrendDirection;
  readonly status: MetricStatus;
  readonly format: MetricFormat;
  readonly tooltip: string | null;
  readonly footer: string | null;
}
