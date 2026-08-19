import { CampaignStatus } from './campaign.model';

export type AdvertisementFormat = 'Imagen' | 'Video' | 'Carrusel' | 'Colección' | 'Reel';

export interface Advertisement {
  readonly id: string;
  readonly adSetId: string;
  readonly adSetName: string;
  readonly campaignId: string;
  readonly campaignName: string;
  readonly externalId?: string;
  readonly name: string;
  readonly status: CampaignStatus;
  readonly format: AdvertisementFormat;
  readonly creativeName: string;
  readonly headline: string;
  readonly destinationUrl: string;
  readonly productId?: string;
  readonly productName?: string;
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
  readonly createdAt: string;
  readonly updatedAt: string;
}
