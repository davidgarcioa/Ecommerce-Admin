import { MetricFormat, MetricStatus } from '../../dashboard/models/dashboard-metric.model';

export interface CampaignMetric {
  readonly id: string;
  readonly title: string;
  readonly value: number;
  readonly formattedValue: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly status: MetricStatus;
  readonly format: MetricFormat;
}
