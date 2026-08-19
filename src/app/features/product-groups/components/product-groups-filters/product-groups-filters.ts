import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import {
  ProductGroupFilters,
  ProductGroupRentabilityFilter,
  ProductGroupSortOption,
  ProductGroupStatus,
} from '../../data-access/product-groups.models';

@Component({
  selector: 'app-product-groups-filters',
  templateUrl: './product-groups-filters.html',
  styleUrl: './product-groups-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupsFiltersComponent {
  readonly search = input('');
  readonly filters = input.required<ProductGroupFilters>();
  readonly sort = input.required<ProductGroupSortOption>();

  readonly searchChange = output<string>();
  readonly filtersChange = output<ProductGroupFilters>();
  readonly sortChange = output<ProductGroupSortOption>();
  readonly clear = output<void>();

  readonly localSearch = signal('');

  onSearch(value: string): void {
    this.localSearch.set(value);
    this.searchChange.emit(value);
  }

  onStatus(value: string): void {
    this.filtersChange.emit({ ...this.filters(), status: value as ProductGroupStatus | 'all' });
  }

  onFeatured(value: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      featured: value as ProductGroupFilters['featured'],
    });
  }

  onRentability(value: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      rentability: value as ProductGroupRentabilityFilter,
    });
  }

  onSort(value: string): void {
    this.sortChange.emit(value as ProductGroupSortOption);
  }
}
