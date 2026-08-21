import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';

import {
  ProductGroupFilters,
  ProductGroupRentabilityFilter,
  ProductGroupSortOption,
  ProductGroupStatus,
} from '../../data-access/product-groups.models';
import { DEFAULT_PRODUCT_GROUP_FILTERS } from '../../utils/product-group.constants';

type ProductGroupSelectKey = 'status' | 'featured' | 'rentability' | 'sort';

interface SelectOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
}

@Component({
  selector: 'app-product-groups-filters',
  templateUrl: './product-groups-filters.html',
  styleUrl: './product-groups-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeSelects()',
    '(keydown.escape)': 'closeSelects()',
  },
})
export class ProductGroupsFiltersComponent implements OnChanges {
  readonly search = input('');
  readonly filters = input.required<ProductGroupFilters>();
  readonly sort = input.required<ProductGroupSortOption>();

  readonly searchChange = output<string>();
  readonly filtersChange = output<ProductGroupFilters>();
  readonly sortChange = output<ProductGroupSortOption>();
  readonly clear = output<void>();

  readonly currentSearch = signal('');
  readonly currentFilters = signal<ProductGroupFilters>(DEFAULT_PRODUCT_GROUP_FILTERS);
  readonly currentSort = signal<ProductGroupSortOption>('sortOrder');
  readonly openSelect = signal<ProductGroupSelectKey | null>(null);
  readonly activeFiltersCount = computed(() => {
    const filters = this.currentFilters();

    return (
      Number(this.currentSearch().trim().length > 0) +
      Number(filters.status !== 'all') +
      Number(filters.featured !== 'all') +
      Number(filters.rentability !== 'all') +
      Number(this.currentSort() !== 'sortOrder')
    );
  });

  readonly statusOptions: readonly SelectOption<ProductGroupStatus | 'all'>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'archived', label: 'Archivados' },
  ];

  readonly featuredOptions: readonly SelectOption<ProductGroupFilters['featured']>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'featured', label: 'Destacados' },
    { value: 'standard', label: 'Estandar' },
  ];

  readonly rentabilityOptions: readonly SelectOption<ProductGroupRentabilityFilter>[] = [
    { value: 'all', label: 'Todas' },
    { value: 'profitable', label: 'Rentables' },
    { value: 'low-margin', label: 'Margen bajo' },
    { value: 'loss', label: 'Pérdida' },
  ];

  readonly sortOptions: readonly SelectOption<ProductGroupSortOption>[] = [
    { value: 'sortOrder', label: 'Orden manual' },
    { value: 'name', label: 'Nombre' },
    { value: 'updatedAt', label: 'Actualizacion' },
    { value: 'estimatedProfit', label: 'Ganancia' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['search']) this.currentSearch.set(this.search());
    if (changes['filters']) this.currentFilters.set(this.filters());
    if (changes['sort']) this.currentSort.set(this.sort());
  }

  protected onSearchChange(event: Event): void {
    this.currentSearch.set((event.target as HTMLInputElement).value);
  }

  protected toggleSelect(key: ProductGroupSelectKey): void {
    this.openSelect.update((current) => (current === key ? null : key));
  }

  protected closeSelects(): void {
    this.openSelect.set(null);
  }

  protected isSelectOpen(key: ProductGroupSelectKey): boolean {
    return this.openSelect() === key;
  }

  protected selectStatus(status: ProductGroupStatus | 'all'): void {
    this.currentFilters.update((filters) => ({ ...filters, status }));
    this.closeSelects();
  }

  protected selectFeatured(featured: ProductGroupFilters['featured']): void {
    this.currentFilters.update((filters) => ({ ...filters, featured }));
    this.closeSelects();
  }

  protected selectRentability(rentability: ProductGroupRentabilityFilter): void {
    this.currentFilters.update((filters) => ({ ...filters, rentability }));
    this.closeSelects();
  }

  protected selectSort(sort: ProductGroupSortOption): void {
    this.currentSort.set(sort);
    this.closeSelects();
  }

  protected selectedStatusLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.currentFilters().status)?.label ??
      'Todos'
    );
  }

  protected selectedFeaturedLabel(): string {
    return (
      this.featuredOptions.find((option) => option.value === this.currentFilters().featured)
        ?.label ?? 'Todos'
    );
  }

  protected selectedRentabilityLabel(): string {
    return (
      this.rentabilityOptions.find((option) => option.value === this.currentFilters().rentability)
        ?.label ?? 'Todas'
    );
  }

  protected selectedSortLabel(): string {
    return this.sortOptions.find((option) => option.value === this.currentSort())?.label ?? 'Orden';
  }

  protected onApply(): void {
    this.searchChange.emit(this.currentSearch());
    this.filtersChange.emit(this.currentFilters());
    this.sortChange.emit(this.currentSort());
  }

  protected onClear(): void {
    this.currentSearch.set('');
    this.currentFilters.set(DEFAULT_PRODUCT_GROUP_FILTERS);
    this.currentSort.set('sortOrder');
    this.clear.emit();
  }
}
