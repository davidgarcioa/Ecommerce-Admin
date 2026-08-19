import { DailyMetric } from './daily-metric.model';
import { DailyOrder } from './daily-order.model';
import { ProductGroupPerformance } from './product-group-performance.model';
import { ReportComparison } from './report-comparison.model';

export interface OperationalStatusItem {
  readonly status: DailyOrder['status'];
  readonly count: number;
  readonly percentage: number;
}

export interface DailyReport {
  readonly generatedAt: string;
  readonly selectedDate: string;
  readonly summaryMetrics: readonly DailyMetric[];
  readonly comparison: readonly ReportComparison[];
  readonly productGroupPerformance: readonly ProductGroupPerformance[];
  readonly operationalStatus: readonly OperationalStatusItem[];
  readonly orders: readonly DailyOrder[];
}

export type ReportExportFormat = 'csv' | 'json';
export type ReportExportContent = 'summary' | 'product-groups' | 'orders' | 'all';

export interface ReportExportOptions {
  readonly format: ReportExportFormat;
  readonly content: ReportExportContent;
  readonly filteredOnly: boolean;
  readonly includeHiddenColumns: boolean;
  readonly includeGeneratedAt: boolean;
}
