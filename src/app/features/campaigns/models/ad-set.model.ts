import { CampaignStatus } from './campaign.model';

export interface AdSet {
  readonly id: string;
  readonly campaignId: string;
  readonly campaignName: string;
  readonly externalId?: string;
  readonly name: string;
  readonly status: CampaignStatus;
  readonly optimizationGoal: string;
  readonly billingEvent: string;
  readonly dailyBudget: number;
  readonly amountSpent: number;
  readonly attributedRevenue: number;
  readonly impressions: number;
  readonly reach: number;
  readonly clicks: number;
  readonly purchases: number;
  readonly ctr: number | null;
  readonly cpc: number | null;
  readonly cpm: number | null;
  readonly cpa: number | null;
  readonly roas: number | null;
  readonly startDate: string;
  readonly endDate?: string;
  readonly updatedAt: string;
}
