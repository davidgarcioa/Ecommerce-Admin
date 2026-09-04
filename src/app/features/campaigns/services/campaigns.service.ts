import { computed, effect, inject, Injectable, signal } from '@angular/core';

import {
  AD_ACCOUNTS,
  DEFAULT_CAMPAIGN_FILTER,
  PRODUCT_GROUPS,
} from '../constants/campaigns.constants';
import { AdSet } from '../models/ad-set.model';
import { Advertisement } from '../models/advertisement.model';
import { Campaign, CampaignFormData, CampaignStatus } from '../models/campaign.model';
import { CampaignFilter } from '../models/campaign-filter.model';
import { CampaignMetric } from '../models/campaign-metric.model';
import { MetricStatus } from '../../dashboard/models/dashboard-metric.model';
import {
  CampaignExportOptions,
  CampaignFormMode,
  CampaignsReport,
} from '../models/campaigns-state.model';
import { ProductAdPerformance } from '../models/product-ad-performance.model';
import { SynchronizationRecord } from '../models/synchronization-record.model';
import {
  buildStatusSummary,
  calculateCpa,
  calculateCpc,
  calculateCpm,
  calculateCtr,
  calculateFrequency,
  calculateRoas,
  escapeCsv,
  formatCampaignValue,
} from '../utils/campaigns.utils';
import { ImportedCampaignsStoreService } from './imported-campaigns-store.service';

export interface CampaignOption {
  readonly id: string;
  readonly name: string;
}

export interface CampaignProductOption extends CampaignOption {
  readonly groupId: string;
}

@Injectable({ providedIn: 'root' })
export class CampaignsService {
  private readonly importedCampaignsStore = inject(ImportedCampaignsStoreService);
  private readonly reportState = signal<CampaignsReport>(this.buildInitialReport());
  private readonly campaignsState = signal<readonly Campaign[]>(this.reportState().campaigns);
  private readonly adSetsState = signal<readonly AdSet[]>(this.reportState().adSets);
  private readonly advertisementsState = signal<readonly Advertisement[]>(
    this.reportState().advertisements,
  );
  private readonly productPerformanceState = signal<readonly ProductAdPerformance[]>(
    this.reportState().productPerformance,
  );
  private readonly filtersState = signal<CampaignFilter>(DEFAULT_CAMPAIGN_FILTER);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly comparisonEnabledState = signal(false);
  private readonly selectedCampaignState = signal<Campaign | null>(null);
  private readonly campaignFormModeState = signal<CampaignFormMode>('create');
  private readonly campaignFormVisibleState = signal(false);
  private readonly exportPanelVisibleState = signal(false);
  private readonly synchronizationHistoryState = signal<readonly SynchronizationRecord[]>(
    this.reportState().synchronizationHistory,
  );
  private readonly lastSynchronizationState = signal(this.reportState().generatedAt);
  private readonly toastMessageState = signal<string | null>(null);

  readonly campaigns = this.campaignsState.asReadonly();
  readonly filteredCampaigns = computed(() => this.filterCampaigns(this.campaignsState()));
  readonly report = this.reportState.asReadonly();
  readonly summaryMetrics = computed(() => buildSummaryMetrics(this.filteredCampaigns()));
  readonly adSets = this.adSetsState.asReadonly();
  readonly filteredAdSets = computed(() => this.filterAdSets(this.adSetsState()));
  readonly advertisements = this.advertisementsState.asReadonly();
  readonly filteredAdvertisements = computed(() =>
    this.filterAdvertisements(this.advertisementsState()),
  );
  readonly productPerformance = computed(() =>
    buildProductPerformance(this.filteredCampaigns(), this.filteredAdvertisements()),
  );
  readonly comparison = computed(() => this.reportState().comparison);
  readonly statusSummary = computed(() => buildStatusSummary(this.filteredCampaigns()));
  readonly filters = this.filtersState.asReadonly();
  readonly accountOptions = computed(() => buildAccountOptions(this.campaignsState()));
  readonly productGroupOptions = computed(() => buildProductGroupOptions(this.campaignsState()));
  readonly productOptions = computed(() => buildProductOptions(this.advertisementsState()));
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly comparisonEnabled = this.comparisonEnabledState.asReadonly();
  readonly selectedCampaign = this.selectedCampaignState.asReadonly();
  readonly campaignFormMode = this.campaignFormModeState.asReadonly();
  readonly campaignFormVisible = this.campaignFormVisibleState.asReadonly();
  readonly exportPanelVisible = this.exportPanelVisibleState.asReadonly();
  readonly synchronizationHistory = this.synchronizationHistoryState.asReadonly();
  readonly lastSynchronization = this.lastSynchronizationState.asReadonly();
  readonly toastMessage = this.toastMessageState.asReadonly();

  constructor() {
    effect(() => {
      const campaigns = this.importedCampaignsStore.campaigns();
      const productPerformance = buildProductPerformance(campaigns, this.advertisementsState());
      const generatedAt = getLatestCampaignTimestamp(campaigns);
      const synchronizationHistory = buildCampaignImportHistory(campaigns, generatedAt);

      this.campaignsState.set(campaigns);
      this.productPerformanceState.set(productPerformance);
      this.synchronizationHistoryState.set(synchronizationHistory);
      this.lastSynchronizationState.set(generatedAt);
      this.reportState.update((report) => ({
        ...report,
        adAccountName: resolveReportAccountName(campaigns),
        generatedAt,
        campaigns,
        summaryMetrics: buildSummaryMetrics(campaigns),
        productPerformance,
        synchronizationHistory,
      }));
    });
  }

  loadCampaigns(): void {
    this.errorState.set(null);
    const report = this.buildInitialReport();
    this.reportState.set(report);
    this.campaignsState.set(report.campaigns);
    this.adSetsState.set(report.adSets);
    this.advertisementsState.set(report.advertisements);
    this.productPerformanceState.set(report.productPerformance);
    this.synchronizationHistoryState.set(report.synchronizationHistory);
    this.lastSynchronizationState.set(report.generatedAt);
  }

  refreshCampaigns(): void {
    this.loadingState.set(true);
    window.setTimeout(() => {
      const synchronizedAt = new Date().toISOString();
      this.loadingState.set(false);
      this.lastSynchronizationState.set(synchronizedAt);
      this.addSynchronizationRecord(
        synchronizedAt,
        'Manual',
        'Exitosa',
        'Campañas refrescadas desde la base local.',
      );
      this.toastMessageState.set('Campañas refrescadas localmente.');
    }, 900);
  }

  synchronizeCampaigns(): void {
    this.loadingState.set(true);
    window.setTimeout(() => {
      const synchronizedAt = new Date().toISOString();
      this.lastSynchronizationState.set(synchronizedAt);
      this.loadingState.set(false);
      this.addSynchronizationRecord(
        synchronizedAt,
        'Manual',
        'Exitosa',
        'Sincronización local completada.',
      );
      this.toastMessageState.set('Sincronización local completada.');
    }, 1000);
  }

  applyFilters(filters: CampaignFilter): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set(DEFAULT_CAMPAIGN_FILTER);
  }

  toggleComparison(): void {
    this.comparisonEnabledState.update((enabled) => !enabled);
  }

  selectCampaign(campaign: Campaign): void {
    this.selectedCampaignState.set(campaign);
  }

  closeCampaignDetail(): void {
    this.selectedCampaignState.set(null);
  }

  openCreateCampaign(): void {
    this.campaignFormModeState.set('create');
    this.selectedCampaignState.set(null);
    this.campaignFormVisibleState.set(true);
  }

  openEditCampaign(campaign: Campaign): void {
    this.campaignFormModeState.set('edit');
    this.selectedCampaignState.set(campaign);
    this.campaignFormVisibleState.set(true);
  }

  openDuplicateCampaign(campaign: Campaign): void {
    this.campaignFormModeState.set('duplicate');
    this.selectedCampaignState.set(campaign);
    this.campaignFormVisibleState.set(true);
  }

  closeCampaignForm(): void {
    this.campaignFormVisibleState.set(false);
  }

  saveCampaign(data: CampaignFormData): void {
    const mode = this.campaignFormModeState();
    const selectedCampaign = this.selectedCampaignState();

    if (mode === 'edit' && selectedCampaign) {
      this.campaignsState.update((campaigns) =>
        campaigns.map((campaign) =>
          campaign.id === selectedCampaign.id ? this.mergeCampaign(campaign, data) : campaign,
        ),
      );
      this.toastMessageState.set('Campaña actualizada localmente.');
    } else {
      this.campaignsState.update((campaigns) => [
        this.createCampaign(data, selectedCampaign),
        ...campaigns,
      ]);
      this.toastMessageState.set(
        mode === 'duplicate' ? 'Campaña duplicada localmente.' : 'Campaña creada localmente.',
      );
    }

    this.persistLocalCampaigns();
    this.closeCampaignForm();
  }

  updateCampaignStatus(id: string, status: CampaignStatus): void {
    this.campaignsState.update((campaigns) =>
      campaigns.map((campaign) =>
        campaign.id === id
          ? { ...campaign, status, updatedAt: new Date().toISOString() }
          : campaign,
      ),
    );
    this.persistLocalCampaigns();
  }

  pauseCampaign(id: string): void {
    this.updateCampaignStatus(id, 'Pausada');
  }

  activateCampaign(id: string): void {
    this.updateCampaignStatus(id, 'Activa');
  }

  archiveCampaign(id: string): void {
    this.updateCampaignStatus(id, 'Archivada');
  }

  deleteCampaign(id: string): void {
    this.campaignsState.update((campaigns) => campaigns.filter((campaign) => campaign.id !== id));
    this.persistLocalCampaigns();
    this.closeCampaignDetail();
    this.toastMessageState.set('Campaña eliminada localmente.');
  }

  openExportPanel(): void {
    this.exportPanelVisibleState.set(true);
  }

  closeExportPanel(): void {
    this.exportPanelVisibleState.set(false);
  }

  exportData(options: CampaignExportOptions): string {
    if (options.format === 'json') {
      return JSON.stringify(this.getExportPayload(options), null, 2);
    }

    return this.createCsv(options);
  }

  private buildInitialReport(): CampaignsReport {
    const localCampaigns = this.importedCampaignsStore.campaigns();
    const campaigns = [...localCampaigns];
    const adSets: readonly AdSet[] = [];
    const advertisements: readonly Advertisement[] = [];
    const productPerformance = buildProductPerformance(campaigns, advertisements);
    const generatedAt = getLatestCampaignTimestamp(campaigns);
    const synchronizationHistory = buildCampaignImportHistory(campaigns, generatedAt);

    return {
      generatedAt,
      adAccountName: resolveReportAccountName(campaigns),
      selectedPeriodLabel: 'Todos los periodos',
      summaryMetrics: buildSummaryMetrics(campaigns),
      campaigns,
      adSets,
      advertisements,
      productPerformance,
      comparison: [],
      synchronizationHistory,
    };
  }

  private addSynchronizationRecord(
    synchronizedAt: string,
    type: SynchronizationRecord['type'],
    status: SynchronizationRecord['status'],
    message: string,
  ): void {
    this.synchronizationHistoryState.update((records) => [
      buildSynchronizationRecord(
        `sync-${Date.now()}`,
        synchronizedAt,
        type,
        status,
        this.campaignsState().length,
        this.adSetsState().length,
        this.advertisementsState().length,
        message,
      ),
      ...records,
    ]);
  }

  private filterCampaigns(campaigns: readonly Campaign[]): readonly Campaign[] {
    const filters = this.filtersState();
    const normalizedSearch = filters.searchTerm.trim().toLowerCase();
    const adsByCampaign = groupAdvertisementsByCampaign(this.advertisementsState());

    return campaigns.filter((campaign) => {
      const campaignAds = adsByCampaign.get(campaign.id) ?? [];
      const matchesPeriod = isCampaignInPeriod(campaign, filters);
      const matchesStatus =
        filters.campaignStatus === 'Todos' || campaign.status === filters.campaignStatus;
      const matchesObjective =
        filters.objective === 'Todos' || campaign.objective === filters.objective;
      const matchesAccount =
        filters.adAccountId === 'all' || campaign.adAccountId === filters.adAccountId;
      const matchesGroup =
        filters.productGroupId === 'all' || campaign.productGroupId === filters.productGroupId;
      const matchesPlatform =
        filters.platform === 'Todas' || campaign.platform === filters.platform;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          campaign.name,
          campaign.objective,
          campaign.status,
          campaign.adAccountName,
          campaign.productGroupName,
          campaign.platform,
          campaign.externalId,
        ]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch)) ||
        campaignAds.some((ad) =>
          [ad.name, ad.productName]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
      const matchesProduct =
        filters.productId === 'all' || campaignAds.some((ad) => ad.productId === filters.productId);

      return (
        matchesPeriod &&
        matchesStatus &&
        matchesObjective &&
        matchesAccount &&
        matchesGroup &&
        matchesPlatform &&
        matchesProduct &&
        matchesSearch
      );
    });
  }

  private filterAdSets(adSets: readonly AdSet[]): readonly AdSet[] {
    const campaignIds = new Set(this.filteredCampaigns().map((campaign) => campaign.id));
    const productId = this.filtersState().productId;

    return adSets.filter(
      (adSet) =>
        campaignIds.has(adSet.campaignId) &&
        (productId === 'all' ||
          this.advertisementsState().some(
            (ad) => ad.adSetId === adSet.id && ad.productId === productId,
          )),
    );
  }

  private filterAdvertisements(advertisements: readonly Advertisement[]): readonly Advertisement[] {
    const campaignIds = new Set(this.filteredCampaigns().map((campaign) => campaign.id));
    const productId = this.filtersState().productId;

    return advertisements.filter(
      (ad) => campaignIds.has(ad.campaignId) && (productId === 'all' || ad.productId === productId),
    );
  }

  private createCampaign(data: CampaignFormData, source: Campaign | null): Campaign {
    const now = new Date().toISOString();

    return {
      id: `campaign-local-${Date.now()}`,
      name: data.name,
      objective: data.objective,
      status: data.status,
      adAccountId: data.adAccountId,
      adAccountName: this.resolveAccountName(data.adAccountId),
      productGroupId: data.productGroupId,
      productGroupName: this.resolveProductGroupName(data.productGroupId),
      platform: data.platform,
      budgetType: data.budgetType,
      dailyBudget: data.dailyBudget ?? undefined,
      lifetimeBudget: data.lifetimeBudget ?? undefined,
      amountSpent: source?.amountSpent ?? 0,
      attributedRevenue: source?.attributedRevenue ?? 0,
      impressions: source?.impressions ?? 0,
      reach: source?.reach ?? 0,
      clicks: source?.clicks ?? 0,
      purchases: source?.purchases ?? 0,
      ctr: source?.ctr ?? null,
      cpc: source?.cpc ?? null,
      cpm: source?.cpm ?? null,
      cpa: source?.cpa ?? null,
      roas: source?.roas ?? null,
      frequency: source?.frequency ?? null,
      startDate: data.startDate,
      endDate: data.endDate ?? undefined,
      createdAt: now,
      updatedAt: now,
      lastSynchronizedAt: now,
      hasWarnings: false,
    };
  }

  private mergeCampaign(campaign: Campaign, data: CampaignFormData): Campaign {
    return {
      ...campaign,
      name: data.name,
      objective: data.objective,
      status: data.status,
      adAccountId: data.adAccountId,
      adAccountName: this.resolveAccountName(data.adAccountId) || campaign.adAccountName,
      productGroupId: data.productGroupId,
      productGroupName:
        this.resolveProductGroupName(data.productGroupId) || campaign.productGroupName,
      platform: data.platform,
      budgetType: data.budgetType,
      dailyBudget: data.dailyBudget ?? undefined,
      lifetimeBudget: data.lifetimeBudget ?? undefined,
      startDate: data.startDate,
      endDate: data.endDate ?? undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  private getExportPayload(options: CampaignExportOptions): object {
    const campaigns = options.filteredOnly ? this.filteredCampaigns() : this.campaignsState();

    return {
      generatedAt: options.includeGeneratedAt ? new Date().toISOString() : undefined,
      summary: this.summaryMetrics(),
      campaigns,
      adSets: options.filteredOnly ? this.filteredAdSets() : this.adSetsState(),
      advertisements: options.filteredOnly
        ? this.filteredAdvertisements()
        : this.advertisementsState(),
      productPerformance: this.productPerformanceState(),
    };
  }

  private createCsv(options: CampaignExportOptions): string {
    const rows = options.filteredOnly ? this.filteredCampaigns() : this.campaignsState();
    const header = [
      'Campaña',
      'Estado',
      'Objetivo',
      'Cuenta',
      'Inversión',
      'Ventas',
      'Compras',
      'CPA',
      'ROAS',
    ];
    const body = rows.map((campaign) =>
      [
        campaign.name,
        campaign.status,
        campaign.objective,
        campaign.adAccountName,
        formatCampaignValue(campaign.amountSpent, 'currency', false),
        formatCampaignValue(campaign.attributedRevenue, 'currency', false),
        campaign.purchases,
        formatCampaignValue(campaign.cpa, 'currency', false),
        formatCampaignValue(campaign.roas, 'multiplier'),
      ]
        .map(escapeCsv)
        .join(','),
    );

    return ['\uFEFF' + header.map(escapeCsv).join(','), ...body].join('\n');
  }

  private persistLocalCampaigns(): void {
    this.importedCampaignsStore.replaceCampaigns(this.campaignsState());
  }

  private resolveAccountName(id: string): string {
    return this.accountOptions().find((item) => item.id === id)?.name ?? 'Cuenta local';
  }

  private resolveProductGroupName(id: string): string {
    return this.productGroupOptions().find((item) => item.id === id)?.name ?? 'Sin conjunto';
  }
}

function buildProductPerformance(
  campaigns: readonly Campaign[],
  advertisements: readonly Advertisement[],
): readonly ProductAdPerformance[] {
  const groups = new Map<string, Advertisement[]>();
  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  for (const ad of advertisements) {
    if (!ad.productId) continue;
    const group = groups.get(ad.productId);

    if (group) {
      group.push(ad);
    } else {
      groups.set(ad.productId, [ad]);
    }
  }

  return [...groups.entries()]
    .map(([productId, ads]) => {
      const campaignIds = new Set(ads.map((ad) => ad.campaignId));
      const relatedCampaigns = [...campaignIds]
        .map((campaignId) => campaignById.get(campaignId))
        .filter((campaign): campaign is Campaign => Boolean(campaign));
      const firstAd = ads[0];
      const relatedCampaign = relatedCampaigns[0];
      const amountSpent = sum(ads, 'amountSpent');
      const attributedRevenue = sum(ads, 'attributedRevenue');
      const impressions = sum(ads, 'impressions');
      const clicks = sum(ads, 'clicks');
      const purchases = sum(ads, 'purchases');

      return {
        productId,
        productName: firstAd?.productName ?? 'Producto sin nombre',
        productGroupName: relatedCampaign?.productGroupName ?? 'Sin conjunto',
        activeCampaigns: relatedCampaigns.filter((campaign) => campaign.status === 'Activa').length,
        amountSpent,
        attributedRevenue,
        purchases,
        cpa: calculateCpa(amountSpent, purchases),
        roas: calculateRoas(attributedRevenue, amountSpent),
        ctr: calculateCtr(clicks, impressions),
        returnRate: 0,
        estimatedProfit: Math.max(0, attributedRevenue - amountSpent),
      };
    })
    .sort((a, b) => b.attributedRevenue - a.attributedRevenue);
}

function buildAccountOptions(campaigns: readonly Campaign[]): readonly CampaignOption[] {
  const options = uniqueCampaignOptions(
    campaigns,
    (campaign) => campaign.adAccountId,
    (campaign) => campaign.adAccountName,
  );

  return options.length > 0 ? options : AD_ACCOUNTS;
}

function buildProductGroupOptions(campaigns: readonly Campaign[]): readonly CampaignOption[] {
  const options = uniqueCampaignOptions(
    campaigns,
    (campaign) => campaign.productGroupId,
    (campaign) => campaign.productGroupName,
  );

  return options.length > 0 ? [{ id: 'all', name: 'Todos' }, ...options] : PRODUCT_GROUPS;
}

function buildProductOptions(
  advertisements: readonly Advertisement[],
): readonly CampaignProductOption[] {
  const byId = new Map<string, CampaignProductOption>();

  for (const ad of advertisements) {
    if (!ad.productId) continue;
    byId.set(ad.productId, {
      id: ad.productId,
      name: ad.productName ?? ad.name,
      groupId: 'all',
    });
  }

  const options = Array.from(byId.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  return [{ id: 'all', name: 'Todos', groupId: 'all' }, ...options];
}

function uniqueCampaignOptions(
  campaigns: readonly Campaign[],
  getId: (campaign: Campaign) => string,
  getName: (campaign: Campaign) => string,
): readonly CampaignOption[] {
  const byId = new Map<string, CampaignOption>();

  for (const campaign of campaigns) {
    const id = getId(campaign).trim();
    const name = getName(campaign).trim();

    if (!id || !name || id === 'all') continue;
    byId.set(id, { id, name });
  }

  return Array.from(byId.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function resolveReportAccountName(campaigns: readonly Campaign[]): string {
  const names = [...new Set(campaigns.map((campaign) => campaign.adAccountName).filter(Boolean))];

  if (names.length === 1) return names[0];
  if (names.length > 1) return `${names.length} cuentas`;

  return 'Datos por archivo';
}

function buildSummaryMetrics(campaigns: readonly Campaign[]): readonly CampaignMetric[] {
  let amountSpent = 0;
  let attributedRevenue = 0;
  let purchases = 0;
  let impressions = 0;
  let clicks = 0;
  let activeCampaigns = 0;
  let warnings = 0;

  for (const campaign of campaigns) {
    amountSpent += Number(campaign.amountSpent) || 0;
    attributedRevenue += Number(campaign.attributedRevenue) || 0;
    purchases += Number(campaign.purchases) || 0;
    impressions += Number(campaign.impressions) || 0;
    clicks += Number(campaign.clicks) || 0;
    if (campaign.status === 'Activa') activeCampaigns += 1;
    if (campaign.hasWarnings) warnings += 1;
  }

  const roas = calculateRoas(attributedRevenue, amountSpent) ?? 0;
  const cpa = calculateCpa(amountSpent, purchases) ?? 0;
  const ctr = calculateCtr(clicks, impressions) ?? 0;

  return [
    metric(
      'active',
      'Campañas activas',
      activeCampaigns,
      'Campañas entregando pauta',
      'campaign',
      'positive',
      'number',
    ),
    metric(
      'spent',
      'Inversión',
      amountSpent,
      'Gasto publicitario filtrado',
      'payments',
      'warning',
      'currency',
    ),
    metric(
      'revenue',
      'Ventas atribuidas',
      attributedRevenue,
      'Ventas reportadas por campaña',
      'shopping_cart',
      'positive',
      'currency',
    ),
    metric(
      'purchases',
      'Compras',
      purchases,
      'Eventos de compra atribuidos',
      'receipt_long',
      'positive',
      'number',
    ),
    metric(
      'roas',
      'ROAS',
      roas,
      'Retorno sobre inversión',
      'query_stats',
      roas >= 3 ? 'positive' : 'warning',
      'multiplier',
    ),
    metric(
      'cpa',
      'CPA promedio',
      cpa,
      'Costo por adquisición',
      'ads_click',
      cpa <= 45000 ? 'positive' : 'warning',
      'currency',
    ),
    metric(
      'ctr',
      'CTR',
      ctr,
      'Clicks sobre impresiones',
      'percent',
      ctr >= 2.5 ? 'positive' : 'warning',
      'percentage',
    ),
    metric(
      'warnings',
      'Alertas',
      warnings,
      'Campañas con revisión pendiente',
      'warning',
      'critical',
      'number',
    ),
  ];
}

function metric(
  id: string,
  title: string,
  value: number,
  subtitle: string,
  icon: string,
  status: MetricStatus,
  format: 'number' | 'currency' | 'percentage' | 'multiplier',
) {
  return {
    id,
    title,
    value,
    formattedValue: formatCampaignValue(value, format),
    subtitle,
    icon,
    status,
    format,
  };
}

function isCampaignInPeriod(campaign: Campaign, filters: CampaignFilter): boolean {
  if (filters.period === 'all') {
    return true;
  }

  const campaignStart = parseDateOnly(campaign.startDate);
  const campaignEnd = campaign.endDate ? parseDateOnly(campaign.endDate) : campaignStart;
  if (!campaignStart || !campaignEnd) {
    return false;
  }

  const today = parseDateOnly(new Date().toISOString());
  if (!today) {
    return true;
  }

  let from: Date | null = null;
  let to: Date | null = today;

  switch (filters.period) {
    case 'today':
      from = today;
      break;
    case 'yesterday':
      from = shiftDate(today, -1);
      to = from;
      break;
    case 'last-7-days':
      from = shiftDate(today, -6);
      break;
    case 'last-14-days':
      from = shiftDate(today, -13);
      break;
    case 'last-30-days':
      from = shiftDate(today, -29);
      break;
    case 'this-month':
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'previous-month':
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      to = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'custom':
      from = filters.dateFrom ? parseDateOnly(filters.dateFrom) : null;
      to = filters.dateTo ? parseDateOnly(filters.dateTo) : null;
      break;
  }

  return (!from || campaignEnd >= from) && (!to || campaignStart <= to);
}

function getLatestCampaignTimestamp(campaigns: readonly Campaign[]): string {
  let latest = '';

  for (const campaign of campaigns) {
    const value = campaign.lastSynchronizedAt || campaign.updatedAt;
    if (value && value > latest) {
      latest = value;
    }
  }

  return latest;
}

function buildCampaignImportHistory(
  campaigns: readonly Campaign[],
  synchronizedAt: string,
): readonly SynchronizationRecord[] {
  if (!campaigns.length || !synchronizedAt) {
    return [];
  }

  return [
    buildSynchronizationRecord(
      'imported-campaigns',
      synchronizedAt,
      'Manual',
      'Exitosa',
      campaigns.length,
      0,
      0,
      'Datos de Meta Ads cargados desde archivo.',
    ),
  ];
}

function buildSynchronizationRecord(
  id: string,
  synchronizedAt: string,
  type: SynchronizationRecord['type'],
  status: SynchronizationRecord['status'],
  campaignsProcessed: number,
  adSetsProcessed: number,
  adsProcessed: number,
  message: string,
): SynchronizationRecord {
  return {
    id,
    synchronizedAt,
    type,
    status,
    campaignsProcessed,
    adSetsProcessed,
    adsProcessed,
    durationMs: 920 + campaignsProcessed * 18,
    message,
    errorsFound: status === 'Fallida' ? 1 : 0,
  };
}

function parseDateOnly(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function shiftDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sum<T, K extends keyof T>(items: readonly T[], key: K): number {
  return items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
}

function groupAdvertisementsByCampaign(
  advertisements: readonly Advertisement[],
): ReadonlyMap<string, readonly Advertisement[]> {
  const byCampaign = new Map<string, Advertisement[]>();

  for (const advertisement of advertisements) {
    const group = byCampaign.get(advertisement.campaignId);

    if (group) {
      group.push(advertisement);
    } else {
      byCampaign.set(advertisement.campaignId, [advertisement]);
    }
  }

  return byCampaign;
}
