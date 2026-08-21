import { Injectable, signal } from '@angular/core';

import { CAMPAIGN_STORAGE_KEY } from '../constants/campaigns.constants';
import { Campaign } from '../models/campaign.model';

@Injectable({ providedIn: 'root' })
export class ImportedCampaignsStoreService {
  private readonly campaignsState = signal<readonly Campaign[]>(this.readCampaigns());

  readonly campaigns = this.campaignsState.asReadonly();

  replaceCampaigns(campaigns: readonly Campaign[]): void {
    this.campaignsState.set(this.mergeCampaigns([], campaigns));
    this.persistCampaigns();
  }

  upsertCampaigns(campaigns: readonly Campaign[]): void {
    this.campaignsState.set(this.mergeCampaigns(this.campaignsState(), campaigns));
    this.persistCampaigns();
  }

  deleteCampaign(id: string): void {
    this.campaignsState.update((campaigns) => campaigns.filter((campaign) => campaign.id !== id));
    this.persistCampaigns();
  }

  private readCampaigns(): readonly Campaign[] {
    try {
      const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as readonly Campaign[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistCampaigns(): void {
    try {
      localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(this.campaignsState()));
    } catch {
      return;
    }
  }

  private mergeCampaigns(
    existingCampaigns: readonly Campaign[],
    incomingCampaigns: readonly Campaign[],
  ): readonly Campaign[] {
    const byBusinessKey = new Map<string, Campaign>();

    existingCampaigns.forEach((campaign) => byBusinessKey.set(campaignKey(campaign), campaign));
    incomingCampaigns.forEach((campaign) => byBusinessKey.set(campaignKey(campaign), campaign));

    return Array.from(byBusinessKey.values()).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }
}

function campaignKey(campaign: Campaign): string {
  return normalizeKey(campaign.externalId || campaign.name);
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}
