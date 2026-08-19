import { Injectable } from '@angular/core';

import { AdSet } from '../models/ad-set.model';
import { Advertisement } from '../models/advertisement.model';
import { Campaign } from '../models/campaign.model';
import {
  MetaAdResponse,
  MetaAdSetResponse,
  MetaCampaignResponse,
  MetaInsightsResponse,
} from '../models/meta-ads-response.model';
import {
  calculateCpa,
  calculateCpc,
  calculateCpm,
  calculateCtr,
  calculateFrequency,
  calculateRoas,
} from '../utils/campaigns.utils';
import { normalizeMetaObjective, normalizeMetaStatus } from '../utils/meta-ads-mapper.utils';

export interface DerivedAdvertisingMetrics {
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
  readonly frequency: number | null;
}

@Injectable({ providedIn: 'root' })
export class MetaAdsAdapterService {
  mapCampaignResponse(
    response: MetaCampaignResponse,
    insights: MetaInsightsResponse,
  ): Partial<Campaign> {
    const metrics = this.calculateDerivedMetrics(insights);

    return {
      externalId: response.id,
      name: response.name,
      objective: this.normalizeObjective(response.objective),
      status: this.normalizeStatus(response.status),
      amountSpent: metrics.amountSpent,
      attributedRevenue: metrics.attributedRevenue,
      impressions: metrics.impressions,
      reach: metrics.reach,
      clicks: metrics.clicks,
      purchases: metrics.purchases,
      ctr: metrics.ctr,
      cpc: metrics.cpc,
      cpm: metrics.cpm,
      cpa: metrics.cpa,
      roas: metrics.roas,
      frequency: metrics.frequency,
    };
  }

  mapAdSetResponse(response: MetaAdSetResponse, insights: MetaInsightsResponse): Partial<AdSet> {
    const metrics = this.calculateDerivedMetrics(insights);

    return {
      externalId: response.id,
      campaignId: response.campaign_id,
      name: response.name,
      status: this.normalizeStatus(response.status),
      optimizationGoal: response.optimization_goal ?? 'Purchase',
      billingEvent: response.billing_event ?? 'Impresiones',
      dailyBudget: Number(response.daily_budget ?? 0),
      ...metrics,
    };
  }

  mapAdResponse(response: MetaAdResponse, insights: MetaInsightsResponse): Partial<Advertisement> {
    const metrics = this.calculateDerivedMetrics(insights);

    return {
      externalId: response.id,
      adSetId: response.adset_id,
      campaignId: response.campaign_id,
      name: response.name,
      status: this.normalizeStatus(response.status),
      creativeName: response.creative?.name ?? 'Creativo sin nombre',
      headline: response.creative?.title ?? response.name,
      destinationUrl: response.creative?.object_url ?? '',
      ...metrics,
    };
  }

  mapInsightsResponse(response: MetaInsightsResponse): DerivedAdvertisingMetrics {
    return this.calculateDerivedMetrics(response);
  }

  normalizeStatus(status: string | undefined): Campaign['status'] {
    return normalizeMetaStatus(status);
  }

  normalizeObjective(objective: string | undefined): Campaign['objective'] {
    return normalizeMetaObjective(objective);
  }

  calculateDerivedMetrics(response: MetaInsightsResponse): DerivedAdvertisingMetrics {
    const amountSpent = Number(response.spend ?? 0);
    const impressions = Number(response.impressions ?? 0);
    const reach = Number(response.reach ?? 0);
    const clicks = Number(response.clicks ?? 0);
    const purchases = Number(
      response.actions?.find((action) => action.action_type === 'purchase')?.value ?? 0,
    );
    const attributedRevenue = Number(
      response.action_values?.find((action) => action.action_type === 'purchase')?.value ?? 0,
    );

    return {
      amountSpent,
      attributedRevenue,
      impressions,
      reach,
      clicks,
      purchases,
      ctr: calculateCtr(clicks, impressions),
      cpc: calculateCpc(amountSpent, clicks),
      cpm: calculateCpm(amountSpent, impressions),
      cpa: calculateCpa(amountSpent, purchases),
      roas: calculateRoas(attributedRevenue, amountSpent),
      frequency: calculateFrequency(impressions, reach),
    };
  }
}
