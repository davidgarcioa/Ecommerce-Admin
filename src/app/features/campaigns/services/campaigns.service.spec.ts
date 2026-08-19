import { TestBed } from '@angular/core/testing';

import { CampaignsService } from './campaigns.service';

describe('CampaignsService', () => {
  let service: CampaignsService;

  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampaignsService);
  });

  it('should load campaigns data', () => {
    expect(service.campaigns().length).toBeGreaterThanOrEqual(20);
    expect(service.adSets().length).toBeGreaterThanOrEqual(30);
    expect(service.advertisements().length).toBeGreaterThanOrEqual(50);
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

    expect(service.filteredCampaigns().length).toBeGreaterThan(0);
    expect(
      service
        .filteredCampaigns()
        .every(
          (campaign) => campaign.startDate >= '2026-08-01' && campaign.startDate <= '2026-08-09',
        ),
    ).toBe(true);
  });

  it('should filter ad sets ads and products by selected product', () => {
    service.applyFilters({
      ...service.filters(),
      productGroupId: 'helvor-2',
      productId: 'helvor-shaper',
    });

    expect(service.filteredCampaigns().length).toBeGreaterThan(0);
    expect(service.filteredAdvertisements().every((ad) => ad.productId === 'helvor-shaper')).toBe(
      true,
    );
    expect(
      service.productPerformance().every((product) => product.productId === 'helvor-shaper'),
    ).toBe(true);
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
      name: 'Campaña local de prueba',
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
    service.saveCampaign({ ...formData, name: 'Campaña local editada' });
    expect(service.campaigns()[0].name).toBe('Campaña local editada');

    service.openDuplicateCampaign(source);
    service.saveCampaign({ ...formData, name: 'Campaña duplicada' });
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

    expect(csv).toContain('Campaña');
    expect(csv).toContain('ROAS');
  });
});
