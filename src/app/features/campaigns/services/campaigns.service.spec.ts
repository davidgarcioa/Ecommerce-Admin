import { TestBed } from '@angular/core/testing';

import { accountScopedStorageKey } from '../../../core/services/account-storage.service';
import { CAMPAIGN_STORAGE_KEY } from '../constants/campaigns.constants';
import { Campaign } from '../models/campaign.model';
import { CampaignsService } from './campaigns.service';

const campaigns: readonly Campaign[] = [
  {
    id: 'campaign-test-active',
    externalId: 'meta-test-active',
    name: 'Helvor 2 | Escala compras',
    objective: 'Ventas',
    status: 'Activa',
    adAccountId: 'act-main',
    adAccountName: 'Ecommerce Colombia Principal',
    productGroupId: 'helvor-2',
    productGroupName: 'Helvor 2',
    platform: 'Facebook',
    budgetType: 'Diario',
    dailyBudget: 100000,
    amountSpent: 400000,
    attributedRevenue: 1600000,
    impressions: 18000,
    reach: 12000,
    clicks: 900,
    purchases: 18,
    ctr: 5,
    cpc: 444,
    cpm: 22222,
    cpa: 22222,
    roas: 4,
    frequency: 1.5,
    startDate: '2026-08-03',
    createdAt: '2026-08-03T08:00:00.000Z',
    updatedAt: '2026-08-04T08:00:00.000Z',
    lastSynchronizedAt: '2026-08-04T08:00:00.000Z',
    hasWarnings: false,
  },
  {
    id: 'campaign-test-paused',
    externalId: 'meta-test-paused',
    name: 'Fyntra 2 | Creativo control',
    objective: 'Ventas',
    status: 'Pausada',
    adAccountId: 'act-main',
    adAccountName: 'Ecommerce Colombia Principal',
    productGroupId: 'fyntra-2',
    productGroupName: 'Fyntra 2',
    platform: 'Instagram',
    budgetType: 'Diario',
    dailyBudget: 60000,
    amountSpent: 120000,
    attributedRevenue: 300000,
    impressions: 9000,
    reach: 7000,
    clicks: 350,
    purchases: 4,
    ctr: 3.9,
    cpc: 343,
    cpm: 13333,
    cpa: 30000,
    roas: 2.5,
    frequency: 1.28,
    startDate: '2026-07-15',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-16T08:00:00.000Z',
    lastSynchronizedAt: '2026-07-16T08:00:00.000Z',
    hasWarnings: false,
  },
];

describe('CampaignsService', () => {
  let service: CampaignsService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(accountScopedStorageKey(CAMPAIGN_STORAGE_KEY), JSON.stringify(campaigns));
    vi.useRealTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampaignsService);
  });

  it('should load campaigns data from local storage', () => {
    expect(service.campaigns().length).toBe(2);
    expect(service.adSets().length).toBe(0);
    expect(service.advertisements().length).toBe(0);
    expect(service.productPerformance().length).toBe(0);
  });

  it('should apply filters and update results', () => {
    const initialCount = service.filteredCampaigns().length;

    service.applyFilters({ ...service.filters(), campaignStatus: 'Pausada' });

    expect(service.filteredCampaigns().length).toBeLessThan(initialCount);
  });

  it('should clear filters and restore data', () => {
    service.applyFilters({ ...service.filters(), searchTerm: 'no existe' });
    service.clearFilters();

    expect(service.filters().searchTerm).toBe('');
    expect(service.filteredCampaigns().length).toBe(service.campaigns().length);
  });

  it('should filter campaigns by custom date range', () => {
    service.applyFilters({
      ...service.filters(),
      period: 'custom',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-09',
    });

    expect(service.filteredCampaigns().length).toBe(1);
    expect(
      service
        .filteredCampaigns()
        .every(
          (campaign) => campaign.startDate >= '2026-08-01' && campaign.startDate <= '2026-08-09',
        ),
    ).toBe(true);
  });

  it('should not invent ad sets ads or product performance without imported ad data', () => {
    service.applyFilters({
      ...service.filters(),
      productGroupId: 'helvor-2',
      productId: 'helvor-shaper',
    });

    expect(service.filteredCampaigns().length).toBe(0);
    expect(service.filteredAdvertisements().length).toBe(0);
    expect(service.productPerformance().length).toBe(0);
  });

  it('should synchronize and add a history record', () => {
    vi.useFakeTimers();
    const initialCount = service.synchronizationHistory().length;

    service.synchronizeCampaigns();
    vi.advanceTimersByTime(1000);

    expect(service.loading()).toBe(false);
    expect(service.synchronizationHistory().length).toBe(initialCount + 1);
  });

  it('should pause and activate campaign', () => {
    const campaign = service.campaigns()[0];

    service.pauseCampaign(campaign.id);
    expect(service.campaigns().find((item) => item.id === campaign.id)?.status).toBe('Pausada');

    service.activateCampaign(campaign.id);
    expect(service.campaigns().find((item) => item.id === campaign.id)?.status).toBe('Activa');
  });

  it('should create edit and duplicate a campaign', () => {
    const initialCount = service.campaigns().length;
    const source = service.campaigns()[0];
    const formData = {
      name: 'Campana local de prueba',
      objective: 'Ventas' as const,
      adAccountId: 'act-main',
      status: 'Activa' as const,
      productGroupId: 'helvor-2',
      platform: 'Facebook' as const,
      budgetType: 'Diario' as const,
      dailyBudget: 100000,
      lifetimeBudget: null,
      startDate: '2026-07-29',
      endDate: null,
    };

    service.openCreateCampaign();
    service.saveCampaign(formData);
    expect(service.campaigns().length).toBe(initialCount + 1);

    const created = service.campaigns()[0];
    service.openEditCampaign(created);
    service.saveCampaign({ ...formData, name: 'Campana local editada' });
    expect(service.campaigns()[0].name).toBe('Campana local editada');

    service.openDuplicateCampaign(source);
    service.saveCampaign({ ...formData, name: 'Campana duplicada' });
    expect(service.campaigns().length).toBe(initialCount + 2);
  });

  it('should delete campaign locally', () => {
    const campaign = service.campaigns()[0];

    service.deleteCampaign(campaign.id);

    expect(service.campaigns().some((item) => item.id === campaign.id)).toBe(false);
  });

  it('should export csv content', () => {
    const csv = service.exportData({
      format: 'csv',
      content: 'campaigns',
      filteredOnly: true,
      includeHiddenColumns: false,
      includeCalculatedMetrics: true,
      includeGeneratedAt: true,
    });

    expect(csv).toContain('Camp');
    expect(csv).toContain('ROAS');
  });
});
