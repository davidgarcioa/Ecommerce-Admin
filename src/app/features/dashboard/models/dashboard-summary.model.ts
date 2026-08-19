import { DashboardMetric } from './dashboard-metric.model';
import { ProductGroup } from './product-group.model';

export interface DashboardSummary {
  readonly generatedAt: string;
  readonly selectedProductGroupId: string;
  readonly primaryMetrics: readonly DashboardMetric[];
  readonly operationalMetrics: readonly DashboardMetric[];
  readonly productGroups: readonly ProductGroup[];
}
