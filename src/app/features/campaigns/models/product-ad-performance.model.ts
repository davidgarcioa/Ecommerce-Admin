export interface ProductAdPerformance {
  readonly productId: string;
  readonly productName: string;
  readonly productGroupName: string;
  readonly activeCampaigns: number;
  readonly amountSpent: number;
  readonly attributedRevenue: number;
  readonly purchases: number;
  readonly cpa: number | null;
  readonly roas: number | null;
  readonly ctr: number | null;
  readonly returnRate?: number;
  readonly estimatedProfit: number;
}
