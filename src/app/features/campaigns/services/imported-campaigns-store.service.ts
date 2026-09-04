import { effect, inject, Injectable, signal } from '@angular/core';

import { AccountStorageService } from '../../../core/services/account-storage.service';
import { CAMPAIGN_STORAGE_KEY } from '../constants/campaigns.constants';
import { Campaign } from '../models/campaign.model';

@Injectable({ providedIn: 'root' })
export class ImportedCampaignsStoreService {
  private readonly accountStorage = inject(AccountStorageService);
  private readonly campaignsState = signal<readonly Campaign[]>(this.readCampaigns());

  readonly campaigns = this.campaignsState.asReadonly();

  constructor() {
    effect(() => {
      this.accountStorage.scope();
      this.campaignsState.set(this.readCampaigns());
    });
  }

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

  clearCampaigns(): void {
    this.campaignsState.set([]);
    this.accountStorage.removeItem(CAMPAIGN_STORAGE_KEY);
  }

  private readCampaigns(): readonly Campaign[] {
    try {
      const raw = this.accountStorage.getItem(CAMPAIGN_STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as readonly Campaign[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistCampaigns(): void {
    this.accountStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(this.campaignsState()));
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
