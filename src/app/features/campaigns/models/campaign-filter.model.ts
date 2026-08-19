import { AdvertisingPlatform, CampaignObjective, CampaignStatus } from './campaign.model';

export type CampaignPeriod =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last-7-days'
  | 'last-14-days'
  | 'last-30-days'
  | 'this-month'
  | 'previous-month'
  | 'custom';

export interface CampaignFilter {
  readonly period: CampaignPeriod;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly adAccountId: string;
  readonly campaignStatus: CampaignStatus | 'Todos';
  readonly objective: CampaignObjective | 'Todos';
  readonly productGroupId: string;
  readonly productId: string;
  readonly platform: AdvertisingPlatform | 'Todas';
  readonly searchTerm: string;
}
