import { computed, Injectable, signal } from '@angular/core';

import {
  AD_ACCOUNTS,
  CAMPAIGN_STORAGE_KEY,
  DEFAULT_CAMPAIGN_FILTER,
  PRODUCTS,
  PRODUCT_GROUPS,
} from '../constants/campaigns.constants';
import { AdSet } from '../models/ad-set.model';
import { Advertisement, AdvertisementFormat } from '../models/advertisement.model';
import {
  AdvertisingPlatform,
  Campaign,
  CampaignFormData,
  CampaignObjective,
  CampaignStatus,
} from '../models/campaign.model';
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

@Injectable({ providedIn: 'root' })
export class CampaignsService {
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

  readonly report = this.reportState.asReadonly();
  readonly summaryMetrics = computed(() =>
    buildSummaryMetrics(this.filterCampaigns(this.campaignsState())),
  );
  readonly campaigns = this.campaignsState.asReadonly();
  readonly filteredCampaigns = computed(() => this.filterCampaigns(this.campaignsState()));
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
    const seedCampaigns = buildSeedCampaigns();
    const localCampaigns = this.readLocalCampaigns();
    const campaigns = [
      ...localCampaigns,
      ...seedCampaigns.filter((seed) => !localCampaigns.some((local) => local.id === seed.id)),
    ];
    const adSets = buildSeedAdSets(campaigns);
    const advertisements = buildSeedAdvertisements(campaigns, adSets);
    const productPerformance = buildProductPerformance(campaigns, advertisements);
    const generatedAt = new Date().toISOString();

    return {
      generatedAt,
      adAccountName: 'Ecommerce Colombia Principal',
      selectedPeriodLabel: 'Todos los periodos',
      summaryMetrics: buildSummaryMetrics(campaigns),
      campaigns,
      adSets,
      advertisements,
      productPerformance,
      comparison: [],
      synchronizationHistory: [
        buildSynchronizationRecord(
          'sync-initial',
          generatedAt,
          'Inicial',
          'Exitosa',
          campaigns.length,
          adSets.length,
          advertisements.length,
          'Datos publicitarios base cargados.',
        ),
      ],
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

    return campaigns.filter((campaign) => {
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
        this.advertisementsState().some(
          (ad) =>
            ad.campaignId === campaign.id &&
            [ad.name, ad.productName]
              .filter((value): value is string => Boolean(value))
              .some((value) => value.toLowerCase().includes(normalizedSearch)),
        );
      const matchesProduct =
        filters.productId === 'all' ||
        this.advertisementsState().some(
          (ad) => ad.campaignId === campaign.id && ad.productId === filters.productId,
        );

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
    const group = PRODUCT_GROUPS.find((item) => item.id === data.productGroupId);
    const account = AD_ACCOUNTS.find((item) => item.id === data.adAccountId);
    const now = new Date().toISOString();

    return {
      id: `campaign-local-${Date.now()}`,
      name: data.name,
      objective: data.objective,
      status: data.status,
      adAccountId: data.adAccountId,
      adAccountName: account?.name ?? 'Cuenta sin nombre',
      productGroupId: data.productGroupId,
      productGroupName: group?.name ?? 'Sin conjunto',
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
    const group = PRODUCT_GROUPS.find((item) => item.id === data.productGroupId);
    const account = AD_ACCOUNTS.find((item) => item.id === data.adAccountId);

    return {
      ...campaign,
      name: data.name,
      objective: data.objective,
      status: data.status,
      adAccountId: data.adAccountId,
      adAccountName: account?.name ?? campaign.adAccountName,
      productGroupId: data.productGroupId,
      productGroupName: group?.name ?? campaign.productGroupName,
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

  private readLocalCampaigns(): readonly Campaign[] {
    try {
      const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as readonly Campaign[];
      return parsed;
    } catch {
      return [];
    }
  }

  private persistLocalCampaigns(): void {
    try {
      const localCampaigns = this.campaignsState().filter((campaign) =>
        campaign.id.startsWith('campaign-local-'),
      );
      localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(localCampaigns));
    } catch {
      return;
    }
  }
}

interface CampaignSeed {
  readonly id: string;
  readonly name: string;
  readonly objective: CampaignObjective;
  readonly status: CampaignStatus;
  readonly adAccountId: string;
  readonly productGroupId: string;
  readonly platform: AdvertisingPlatform;
  readonly dailyBudget: number;
  readonly amountSpent: number;
  readonly attributedRevenue: number;
  readonly impressions: number;
  readonly reach: number;
  readonly clicks: number;
  readonly purchases: number;
  readonly startDate: string;
  readonly hasWarnings?: boolean;
  readonly warningMessage?: string;
}

const CAMPAIGN_SEEDS: readonly CampaignSeed[] = [
  seed(
    'camp-fyntra-abo',
    'Fyntra 2 | ABO | Prospecting',
    'Ventas',
    'Activa',
    'act-main',
    'fyntra-2',
    'Varias plataformas',
    185000,
    2240000,
    9120000,
    188400,
    102500,
    6810,
    68,
    '2026-07-21',
  ),
  seed(
    'camp-helvor-scale',
    'Helvor 2 | Escala compras',
    'Ventas',
    'Activa',
    'act-scale',
    'helvor-2',
    'Facebook',
    165000,
    1980000,
    7810000,
    164200,
    91300,
    5120,
    57,
    '2026-07-24',
  ),
  seed(
    'camp-fondal-reels',
    'Fondal | Reels ventas frias',
    'Ventas',
    'Activa',
    'act-main',
    'fondal',
    'Instagram',
    142000,
    1730000,
    6140000,
    151800,
    80200,
    4890,
    42,
    '2026-07-26',
  ),
  seed(
    'camp-gadrix-remarketing',
    'Gadrix 2 | Remarketing 14D',
    'Ventas',
    'Activa',
    'act-scale',
    'gadrix-2',
    'Varias plataformas',
    118000,
    1280000,
    5220000,
    93400,
    50400,
    3560,
    36,
    '2026-08-01',
  ),
  seed(
    'camp-halcor-broad',
    'Halcor | Broad hogares',
    'Ventas',
    'Activa',
    'act-main',
    'halcor',
    'Facebook',
    95000,
    1020000,
    3110000,
    81700,
    42600,
    2520,
    24,
    '2026-08-03',
    true,
    'CPA por encima del objetivo',
  ),
  seed(
    'camp-gemvia-creatives',
    'Gemvia | Creativos UGC',
    'Ventas',
    'En revisión',
    'act-tests',
    'gemvia',
    'Instagram',
    76000,
    420000,
    910000,
    41800,
    21900,
    980,
    7,
    '2026-08-15',
  ),
  seed(
    'camp-fyntra-retargeting',
    'Fyntra 2 | Retargeting visitantes',
    'Ventas',
    'Activa',
    'act-main',
    'fyntra-2',
    'Facebook',
    88000,
    940000,
    4680000,
    50600,
    30200,
    2110,
    34,
    '2026-08-02',
  ),
  seed(
    'camp-helvor-leads',
    'Helvor 2 | Clientes potenciales',
    'Clientes potenciales',
    'Pausada',
    'act-tests',
    'helvor-2',
    'Messenger',
    54000,
    640000,
    1260000,
    70200,
    38600,
    1820,
    13,
    '2026-07-29',
  ),
  seed(
    'camp-fondal-traffic',
    'Fondal | Tráfico ficha producto',
    'Tráfico',
    'Pausada',
    'act-main',
    'fondal',
    'Instagram',
    62000,
    510000,
    820000,
    88100,
    50200,
    3310,
    6,
    '2026-07-18',
  ),
  seed(
    'camp-gadrix-testing',
    'Gadrix 2 | Testing creativo',
    'Interacción',
    'Activa',
    'act-tests',
    'gadrix-2',
    'Instagram',
    70000,
    760000,
    1760000,
    119400,
    64100,
    4220,
    15,
    '2026-08-05',
  ),
  seed(
    'camp-halcor-retention',
    'Halcor | Retención compradores',
    'Ventas',
    'Finalizada',
    'act-scale',
    'halcor',
    'Facebook',
    84000,
    880000,
    2670000,
    62300,
    35400,
    1860,
    21,
    '2026-07-01',
  ),
  seed(
    'camp-gemvia-prospecting',
    'Gemvia | Prospecting intereses',
    'Ventas',
    'Activa',
    'act-main',
    'gemvia',
    'Audience Network',
    102000,
    1160000,
    2940000,
    137900,
    70100,
    2950,
    22,
    '2026-08-04',
    true,
    'Frecuencia alta en audiencia principal',
  ),
  seed(
    'camp-fyntra-lookalike',
    'Fyntra 2 | Lookalike compradores',
    'Ventas',
    'Activa',
    'act-scale',
    'fyntra-2',
    'Facebook',
    152000,
    1840000,
    7320000,
    144700,
    81600,
    4630,
    54,
    '2026-07-31',
  ),
  seed(
    'camp-helvor-reels',
    'Helvor 2 | Reels prueba Hook',
    'Interacción',
    'En revisión',
    'act-tests',
    'helvor-2',
    'Instagram',
    69000,
    350000,
    640000,
    53700,
    29500,
    2050,
    5,
    '2026-08-16',
  ),
  seed(
    'camp-fondal-advantage',
    'Fondal | Advantage+ shopping',
    'Ventas',
    'Activa',
    'act-scale',
    'fondal',
    'Varias plataformas',
    128000,
    1490000,
    5310000,
    132600,
    72100,
    3720,
    39,
    '2026-08-06',
  ),
  seed(
    'camp-gadrix-awareness',
    'Gadrix 2 | Reconocimiento marca',
    'Reconocimiento',
    'Finalizada',
    'act-main',
    'gadrix-2',
    'Audience Network',
    48000,
    310000,
    280000,
    226000,
    148000,
    1820,
    2,
    '2026-07-09',
  ),
  seed(
    'camp-halcor-issue',
    'Halcor | Catálogo dinámico',
    'Ventas',
    'Con errores',
    'act-main',
    'halcor',
    'Facebook',
    92000,
    690000,
    1210000,
    48200,
    25400,
    870,
    8,
    '2026-08-10',
    true,
    'Conjunto rechazado por política',
  ),
  seed(
    'camp-gemvia-messenger',
    'Gemvia | Conversaciones Messenger',
    'Clientes potenciales',
    'Activa',
    'act-tests',
    'gemvia',
    'Messenger',
    58000,
    560000,
    1420000,
    61200,
    31600,
    1640,
    11,
    '2026-08-08',
  ),
  seed(
    'camp-fyntra-archived',
    'Fyntra 2 | Oferta anterior',
    'Ventas',
    'Archivada',
    'act-main',
    'fyntra-2',
    'Facebook',
    100000,
    740000,
    2380000,
    65100,
    36800,
    1620,
    18,
    '2026-06-25',
  ),
  seed(
    'camp-helvor-advantage',
    'Helvor 2 | Advantage+ control',
    'Ventas',
    'Activa',
    'act-scale',
    'helvor-2',
    'Varias plataformas',
    132000,
    1560000,
    5480000,
    121300,
    68300,
    3980,
    41,
    '2026-08-02',
  ),
  seed(
    'camp-fondal-carousel',
    'Fondal | Carrusel beneficios',
    'Ventas',
    'Pausada',
    'act-main',
    'fondal',
    'Facebook',
    83000,
    720000,
    1910000,
    77900,
    42100,
    2140,
    16,
    '2026-07-22',
  ),
  seed(
    'camp-gadrix-catalog',
    'Gadrix 2 | Catálogo ventas',
    'Ventas',
    'Activa',
    'act-scale',
    'gadrix-2',
    'Varias plataformas',
    106000,
    1210000,
    3860000,
    94500,
    51700,
    2780,
    29,
    '2026-08-07',
  ),
  seed(
    'camp-halcor-reels',
    'Halcor | Reels problema-solución',
    'Tráfico',
    'En revisión',
    'act-tests',
    'halcor',
    'Instagram',
    52000,
    280000,
    390000,
    40300,
    21600,
    1320,
    4,
    '2026-08-17',
  ),
  seed(
    'camp-gemvia-winback',
    'Gemvia | Winback compradores',
    'Ventas',
    'Finalizada',
    'act-scale',
    'gemvia',
    'Facebook',
    74000,
    610000,
    1840000,
    49800,
    28900,
    1210,
    14,
    '2026-07-12',
  ),
];

const AD_SET_VARIANTS = ['Broad', 'Retargeting'] as const;
const AD_FORMATS: readonly AdvertisementFormat[] = ['Imagen', 'Video', 'Carrusel', 'Reel'];

function seed(
  id: string,
  name: string,
  objective: CampaignObjective,
  status: CampaignStatus,
  adAccountId: string,
  productGroupId: string,
  platform: AdvertisingPlatform,
  dailyBudget: number,
  amountSpent: number,
  attributedRevenue: number,
  impressions: number,
  reach: number,
  clicks: number,
  purchases: number,
  startDate: string,
  hasWarnings = false,
  warningMessage?: string,
): CampaignSeed {
  return {
    id,
    name,
    objective,
    status,
    adAccountId,
    productGroupId,
    platform,
    dailyBudget,
    amountSpent,
    attributedRevenue,
    impressions,
    reach,
    clicks,
    purchases,
    startDate,
    hasWarnings,
    warningMessage,
  };
}

function buildSeedCampaigns(): readonly Campaign[] {
  return CAMPAIGN_SEEDS.map((item, index) => {
    const productGroup = PRODUCT_GROUPS.find((group) => group.id === item.productGroupId);
    const account = AD_ACCOUNTS.find((current) => current.id === item.adAccountId);
    const updatedAt = addDaysIso(item.startDate, 20 + (index % 7));

    return {
      ...metricsFor(
        item.amountSpent,
        item.attributedRevenue,
        item.impressions,
        item.reach,
        item.clicks,
        item.purchases,
      ),
      id: item.id,
      externalId: `meta-${100000 + index}`,
      name: item.name,
      objective: item.objective,
      status: item.status,
      adAccountId: item.adAccountId,
      adAccountName: account?.name ?? 'Cuenta sin nombre',
      productGroupId: item.productGroupId,
      productGroupName: productGroup?.name ?? 'Sin conjunto',
      platform: item.platform,
      budgetType: 'Diario',
      dailyBudget: item.dailyBudget,
      amountSpent: item.amountSpent,
      attributedRevenue: item.attributedRevenue,
      impressions: item.impressions,
      reach: item.reach,
      clicks: item.clicks,
      purchases: item.purchases,
      startDate: item.startDate,
      createdAt: `${item.startDate}T08:00:00.000Z`,
      updatedAt,
      lastSynchronizedAt: updatedAt,
      hasWarnings: item.hasWarnings ?? false,
      warningMessage: item.warningMessage,
    };
  });
}

function buildSeedAdSets(campaigns: readonly Campaign[]): readonly AdSet[] {
  return campaigns.flatMap((campaign, campaignIndex) =>
    AD_SET_VARIANTS.map((variant, variantIndex) => {
      const ratio = variantIndex === 0 ? 0.62 : 0.38;
      const amountSpent = Math.round(campaign.amountSpent * ratio);
      const attributedRevenue = Math.round(campaign.attributedRevenue * ratio);
      const impressions = Math.round(campaign.impressions * ratio);
      const reach = Math.round(campaign.reach * ratio);
      const clicks = Math.round(campaign.clicks * ratio);
      const purchases = Math.round(campaign.purchases * ratio);

      return {
        ...metricsFor(amountSpent, attributedRevenue, impressions, reach, clicks, purchases),
        id: `${campaign.id}-set-${variantIndex + 1}`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        externalId: `adset-${campaignIndex + 1}-${variantIndex + 1}`,
        name: `${campaign.productGroupName} | ${variant}`,
        status: campaign.status,
        optimizationGoal: campaign.objective === 'Ventas' ? 'Compras' : campaign.objective,
        billingEvent: 'Impresiones',
        dailyBudget: Math.round((campaign.dailyBudget ?? campaign.lifetimeBudget ?? 0) * ratio),
        amountSpent,
        attributedRevenue,
        impressions,
        reach,
        clicks,
        purchases,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        updatedAt: campaign.updatedAt,
      };
    }),
  );
}

function buildSeedAdvertisements(
  campaigns: readonly Campaign[],
  adSets: readonly AdSet[],
): readonly Advertisement[] {
  return adSets.flatMap((adSet, adSetIndex) => {
    const campaign = campaigns.find((item) => item.id === adSet.campaignId);
    const products = productsForGroup(campaign?.productGroupId ?? 'all');

    return [0, 1].map((itemIndex) => {
      const ratio = itemIndex === 0 ? 0.58 : 0.42;
      const amountSpent = Math.round(adSet.amountSpent * ratio);
      const attributedRevenue = Math.round(adSet.attributedRevenue * ratio);
      const impressions = Math.round(adSet.impressions * ratio);
      const reach = Math.round(adSet.reach * ratio);
      const clicks = Math.round(adSet.clicks * ratio);
      const purchases = Math.round(adSet.purchases * ratio);
      const product = products[(adSetIndex + itemIndex) % products.length];
      const format = AD_FORMATS[(adSetIndex + itemIndex) % AD_FORMATS.length];

      return {
        ...metricsFor(amountSpent, attributedRevenue, impressions, reach, clicks, purchases),
        id: `${adSet.id}-ad-${itemIndex + 1}`,
        adSetId: adSet.id,
        adSetName: adSet.name,
        campaignId: adSet.campaignId,
        campaignName: adSet.campaignName,
        externalId: `ad-${adSetIndex + 1}-${itemIndex + 1}`,
        name: `${product.name} | ${format} ${itemIndex + 1}`,
        status: adSet.status,
        format,
        creativeName: `${product.name} ${itemIndex === 0 ? 'beneficio principal' : 'prueba social'}`,
        headline: itemIndex === 0 ? 'Oferta disponible hoy' : 'Clientes reales, resultados reales',
        destinationUrl: `https://linkoba.local/productos/${product.id}`,
        productId: product.id,
        productName: product.name,
        amountSpent,
        attributedRevenue,
        impressions,
        reach,
        clicks,
        purchases,
        createdAt: `${adSet.startDate}T09:30:00.000Z`,
        updatedAt: adSet.updatedAt,
      };
    });
  });
}

function buildProductPerformance(
  campaigns: readonly Campaign[],
  advertisements: readonly Advertisement[],
): readonly ProductAdPerformance[] {
  const groups = new Map<string, Advertisement[]>();

  for (const ad of advertisements) {
    if (!ad.productId) continue;
    groups.set(ad.productId, [...(groups.get(ad.productId) ?? []), ad]);
  }

  return [...groups.entries()]
    .map(([productId, ads]) => {
      const product = PRODUCTS.find((item) => item.id === productId);
      const campaignIds = new Set(ads.map((ad) => ad.campaignId));
      const relatedCampaigns = campaigns.filter((campaign) => campaignIds.has(campaign.id));
      const amountSpent = sum(ads, 'amountSpent');
      const attributedRevenue = sum(ads, 'attributedRevenue');
      const impressions = sum(ads, 'impressions');
      const clicks = sum(ads, 'clicks');
      const purchases = sum(ads, 'purchases');

      return {
        productId,
        productName: product?.name ?? 'Producto sin nombre',
        productGroupName:
          PRODUCT_GROUPS.find((group) => group.id === product?.groupId)?.name ?? 'Sin conjunto',
        activeCampaigns: relatedCampaigns.filter((campaign) => campaign.status === 'Activa').length,
        amountSpent,
        attributedRevenue,
        purchases,
        cpa: calculateCpa(amountSpent, purchases),
        roas: calculateRoas(attributedRevenue, amountSpent),
        ctr: calculateCtr(clicks, impressions),
        returnRate: Number((4 + (purchases % 7) * 0.7).toFixed(1)),
        estimatedProfit: Math.round(attributedRevenue * 0.52 - amountSpent),
      };
    })
    .sort((a, b) => b.attributedRevenue - a.attributedRevenue);
}

function buildSummaryMetrics(campaigns: readonly Campaign[]): readonly CampaignMetric[] {
  const amountSpent = sum(campaigns, 'amountSpent');
  const attributedRevenue = sum(campaigns, 'attributedRevenue');
  const purchases = sum(campaigns, 'purchases');
  const impressions = sum(campaigns, 'impressions');
  const clicks = sum(campaigns, 'clicks');
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'Activa').length;
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
      campaigns.filter((campaign) => campaign.hasWarnings).length,
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

function metricsFor(
  amountSpent: number,
  attributedRevenue: number,
  impressions: number,
  reach: number,
  clicks: number,
  purchases: number,
) {
  return {
    ctr: calculateCtr(clicks, impressions),
    cpc: calculateCpc(amountSpent, clicks),
    cpm: calculateCpm(amountSpent, impressions),
    cpa: calculateCpa(amountSpent, purchases),
    roas: calculateRoas(attributedRevenue, amountSpent),
    frequency: calculateFrequency(impressions, reach),
  };
}

function isCampaignInPeriod(campaign: Campaign, filters: CampaignFilter): boolean {
  if (filters.period === 'all') {
    return true;
  }

  const campaignDate = parseDateOnly(campaign.startDate);
  if (!campaignDate) {
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

  return (!from || campaignDate >= from) && (!to || campaignDate <= to);
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

function productsForGroup(groupId: string) {
  const products = PRODUCTS.filter((product) => product.groupId === groupId);
  return products.length > 0 ? products : PRODUCTS.filter((product) => product.id !== 'all');
}

function addDaysIso(dateIso: string, days: number): string {
  const next = new Date(`${dateIso}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
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
