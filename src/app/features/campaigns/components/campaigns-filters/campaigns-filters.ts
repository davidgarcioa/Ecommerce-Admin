import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

import {
  AD_ACCOUNTS,
  ADVERTISING_PLATFORMS,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_PERIOD_OPTIONS,
  CAMPAIGN_STATUSES,
  DEFAULT_CAMPAIGN_FILTER,
  PRODUCT_GROUPS,
  PRODUCTS,
} from '../../constants/campaigns.constants';
import { CampaignFilter, CampaignPeriod } from '../../models/campaign-filter.model';
import {
  AdvertisingPlatform,
  CampaignObjective,
  CampaignStatus,
} from '../../models/campaign.model';

interface CampaignFilterSummaryItem {
  label: string;
  value: string;
  active: boolean;
}

interface CampaignOption {
  readonly id: string;
  readonly name: string;
}

interface CampaignProductOption extends CampaignOption {
  readonly groupId: string;
}

type CampaignFilterMenu =
  'period' | 'status' | 'group' | 'account' | 'objective' | 'product' | 'platform';

@Component({
  selector: 'app-campaigns-filters',
  templateUrl: './campaigns-filters.html',
  styleUrl: './campaigns-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsFiltersComponent {
  readonly filters = input.required<CampaignFilter>();
  readonly accounts = input<readonly CampaignOption[]>(AD_ACCOUNTS);
  readonly groups = input<readonly CampaignOption[]>(PRODUCT_GROUPS);
  readonly products = input<readonly CampaignProductOption[]>(PRODUCTS);
  readonly applyFilters = output<CampaignFilter>();
  readonly clearFilters = output<void>();
  readonly current = signal<CampaignFilter>(DEFAULT_CAMPAIGN_FILTER);
  readonly advancedVisible = signal(false);
  readonly openMenu = signal<CampaignFilterMenu | null>(null);

  readonly periods = CAMPAIGN_PERIOD_OPTIONS;
  readonly statuses = CAMPAIGN_STATUSES;
  readonly objectives = CAMPAIGN_OBJECTIVES;
  readonly platforms = ADVERTISING_PLATFORMS;
  readonly filteredProducts = computed(() => {
    const groupId = this.current().productGroupId;
    const products = this.products();

    if (groupId === 'all') {
      return products;
    }

    return products.filter((product) => product.id === 'all' || product.groupId === groupId);
  });
  readonly activeFilterSummary = computed(() => this.filterSummary().filter((item) => item.active));
  readonly activeFiltersCount = computed(() => this.activeFilterSummary().length);
  readonly filterSummary = computed<CampaignFilterSummaryItem[]>(() => {
    const current = this.current();

    return [
      {
        label: 'Periodo',
        value: this.periods.find((period) => period.value === current.period)?.label ?? 'Todos',
        active: current.period !== DEFAULT_CAMPAIGN_FILTER.period,
      },
      {
        label: 'Fechas',
        value:
          current.period === 'custom'
            ? `${current.dateFrom || 'Desde'} - ${current.dateTo || 'Hasta'}`
            : 'Sin rango manual',
        active: current.period === 'custom' && Boolean(current.dateFrom || current.dateTo),
      },
      {
        label: 'Cuenta',
        value:
          this.accounts().find((account) => account.id === current.adAccountId)?.name ??
          'Todas las cuentas',
        active: current.adAccountId !== DEFAULT_CAMPAIGN_FILTER.adAccountId,
      },
      {
        label: 'Estado',
        value: current.campaignStatus,
        active: current.campaignStatus !== DEFAULT_CAMPAIGN_FILTER.campaignStatus,
      },
      {
        label: 'Objetivo',
        value: current.objective,
        active: current.objective !== DEFAULT_CAMPAIGN_FILTER.objective,
      },
      {
        label: 'Conjunto',
        value:
          this.groups().find((group) => group.id === current.productGroupId)?.name ??
          'Todos los conjuntos',
        active: current.productGroupId !== DEFAULT_CAMPAIGN_FILTER.productGroupId,
      },
      {
        label: 'Producto',
        value: this.products().find((product) => product.id === current.productId)?.name ?? 'Todos',
        active: current.productId !== DEFAULT_CAMPAIGN_FILTER.productId,
      },
      {
        label: 'Plataforma',
        value: current.platform,
        active: current.platform !== DEFAULT_CAMPAIGN_FILTER.platform,
      },
      {
        label: 'Búsqueda',
        value: current.searchTerm.trim() || 'Sin búsqueda',
        active: current.searchTerm.trim().length > 0,
      },
    ];
  });

  constructor() {
    effect(() => {
      const filters = { ...this.filters() };

      this.current.set(filters);
      this.advancedVisible.set(hasAdvancedFilters(filters));
    });
  }

  onPeriodChange(event: Event): void {
    const period = (event.target as HTMLSelectElement).value as CampaignPeriod;

    this.patch({
      period,
      dateFrom: period === 'custom' ? this.current().dateFrom : undefined,
      dateTo: period === 'custom' ? this.current().dateTo : undefined,
    });
  }

  onAccountChange(event: Event): void {
    this.patch({ adAccountId: (event.target as HTMLSelectElement).value });
  }

  onStatusChange(event: Event): void {
    this.patch({
      campaignStatus: (event.target as HTMLSelectElement).value as CampaignStatus | 'Todos',
    });
  }

  onObjectiveChange(event: Event): void {
    this.patch({
      objective: (event.target as HTMLSelectElement).value as CampaignObjective | 'Todos',
    });
  }

  onGroupChange(event: Event): void {
    this.patch({ productGroupId: (event.target as HTMLSelectElement).value, productId: 'all' });
  }

  onProductChange(event: Event): void {
    this.patch({ productId: (event.target as HTMLSelectElement).value });
  }

  onPlatformChange(event: Event): void {
    this.patch({
      platform: (event.target as HTMLSelectElement).value as AdvertisingPlatform | 'Todas',
    });
  }

  onSearchChange(event: Event): void {
    this.patch({ searchTerm: (event.target as HTMLInputElement).value });
  }

  onDateChange(key: 'dateFrom' | 'dateTo', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.patch({ [key]: value || undefined });
  }

  @HostListener('document:click')
  closeSelects(): void {
    this.openMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  closeSelectsOnEscape(): void {
    this.closeSelects();
  }

  toggleSelect(menu: CampaignFilterMenu): void {
    this.openMenu.update((current) => (current === menu ? null : menu));
  }

  isSelectOpen(menu: CampaignFilterMenu): boolean {
    return this.openMenu() === menu;
  }

  selectedPeriodLabel(): string {
    return this.periods.find((period) => period.value === this.current().period)?.label ?? 'Todos';
  }

  selectedAccountLabel(): string {
    return (
      this.accounts().find((account) => account.id === this.current().adAccountId)?.name ?? 'Todas'
    );
  }

  selectedGroupLabel(): string {
    return (
      this.groups().find((group) => group.id === this.current().productGroupId)?.name ?? 'Todos'
    );
  }

  selectedProductLabel(): string {
    return (
      this.products().find((product) => product.id === this.current().productId)?.name ?? 'Todos'
    );
  }

  selectPeriod(period: CampaignPeriod): void {
    this.patch({
      period,
      dateFrom: period === 'custom' ? this.current().dateFrom : undefined,
      dateTo: period === 'custom' ? this.current().dateTo : undefined,
    });
    this.closeSelects();
  }

  selectStatus(status: CampaignStatus | 'Todos'): void {
    this.patch({ campaignStatus: status });
    this.closeSelects();
  }

  selectGroup(productGroupId: string): void {
    this.patch({ productGroupId, productId: 'all' });
    this.closeSelects();
  }

  selectAccount(adAccountId: string): void {
    this.patch({ adAccountId });
    this.closeSelects();
  }

  selectObjective(objective: CampaignObjective | 'Todos'): void {
    this.patch({ objective });
    this.closeSelects();
  }

  selectProduct(productId: string): void {
    this.patch({ productId });
    this.closeSelects();
  }

  selectPlatform(platform: AdvertisingPlatform | 'Todas'): void {
    this.patch({ platform });
    this.closeSelects();
  }

  onApply(): void {
    this.applyFilters.emit(this.current());
  }

  onClear(): void {
    this.current.set(DEFAULT_CAMPAIGN_FILTER);
    this.advancedVisible.set(false);
    this.clearFilters.emit();
  }

  toggleAdvanced(): void {
    this.advancedVisible.update((visible) => !visible);
  }

  private patch(value: Partial<CampaignFilter>): void {
    this.current.update((current) => ({ ...current, ...value }));
  }
}

function hasAdvancedFilters(filters: CampaignFilter): boolean {
  return (
    filters.adAccountId !== DEFAULT_CAMPAIGN_FILTER.adAccountId ||
    filters.objective !== DEFAULT_CAMPAIGN_FILTER.objective ||
    filters.productId !== DEFAULT_CAMPAIGN_FILTER.productId ||
    filters.platform !== DEFAULT_CAMPAIGN_FILTER.platform
  );
}
