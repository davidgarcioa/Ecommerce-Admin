export type CampaignComparisonDirection = 'up' | 'down' | 'neutral';
export type CampaignComparisonTone = 'positive' | 'negative' | 'neutral';

export interface CampaignComparison {
  readonly id: string;
  readonly label: string;
  readonly currentValue: number;
  readonly previousValue: number;
  readonly formattedCurrentValue: string;
  readonly formattedPreviousValue: string;
  readonly absoluteDifference: number;
  readonly percentageDifference: number;
  readonly direction: CampaignComparisonDirection;
  readonly tone: CampaignComparisonTone;
}
