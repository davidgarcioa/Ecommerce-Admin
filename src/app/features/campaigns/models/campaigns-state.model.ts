import { AdSet } from './ad-set.model';
import { Advertisement } from './advertisement.model';
import { Campaign } from './campaign.model';
import { CampaignComparison } from './campaign-comparison.model';
import { CampaignMetric } from './campaign-metric.model';
import { ProductAdPerformance } from './product-ad-performance.model';
import { SynchronizationRecord } from './synchronization-record.model';

export interface CampaignStatusSummaryItem {
  readonly status: string;
  readonly count: number;
  readonly percentage: number;
  readonly amountSpent: number;
  readonly attributedRevenue: number;
  readonly averageRoas: number | null;
}

export interface CampaignsReport {
  readonly generatedAt: string;
  readonly adAccountName: string;
  readonly selectedPeriodLabel: string;
  readonly summaryMetrics: readonly CampaignMetric[];
  readonly campaigns: readonly Campaign[];
  readonly adSets: readonly AdSet[];
  readonly advertisements: readonly Advertisement[];
  readonly productPerformance: readonly ProductAdPerformance[];
  readonly comparison: readonly CampaignComparison[];
  readonly synchronizationHistory: readonly SynchronizationRecord[];
}

export type CampaignFormMode = 'create' | 'edit' | 'duplicate';
export type CampaignExportFormat = 'csv' | 'json';
export type CampaignExportContent = 'campaigns' | 'adsets' | 'ads' | 'products' | 'summary' | 'all';

export interface CampaignExportOptions {
  readonly format: CampaignExportFormat;
  readonly content: CampaignExportContent;
  readonly filteredOnly: boolean;
  readonly includeHiddenColumns: boolean;
  readonly includeCalculatedMetrics: boolean;
  readonly includeGeneratedAt: boolean;
}
