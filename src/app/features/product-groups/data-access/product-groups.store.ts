import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { DailyOrder } from '../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../daily-report/services/imported-orders-store.service';
import {
  DEFAULT_PRODUCT_GROUP_FILTERS,
  PRODUCT_GROUPS_PERMISSIONS,
} from '../utils/product-group.constants';
import {
  AssociateProductsRequest,
  CreateProductGroupRequest,
  ProductGroup,
  ProductGroupFilters,
  ProductGroupHistoryEntry,
  ProductGroupListItem,
  ProductGroupProduct,
  ProductGroupProfitability,
  ProductGroupSortOption,
  ProductGroupViewMode,
  ReorderProductsRequest,
  UpdateProductGroupRequest,
} from './product-groups.models';
import { resolveProductGroupStatus, toProductGroupListItem } from './product-groups.mapper';
import { ProductGroupsApiService } from './product-groups-api.service';
import {
  toImportedProductGroups,
  toImportedProducts,
  toImportedProfitability,
} from './imported-product-groups.mapper';

@Injectable()
export class ProductGroupsStore {
  private readonly api = inject(ProductGroupsApiService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);

  private readonly groupsState = signal<readonly ProductGroup[]>([]);
  private readonly selectedGroupState = signal<ProductGroup | null>(null);
  private readonly profitabilityState = signal<ProductGroupProfitability | null>(null);
  private readonly associatedProductsState = signal<readonly ProductGroupProduct[]>([]);
  private readonly availableProductsState = signal<readonly ProductGroupProduct[]>([]);
  private readonly historyState = signal<readonly ProductGroupHistoryEntry[]>([]);
  private readonly filtersState = signal<ProductGroupFilters>(DEFAULT_PRODUCT_GROUP_FILTERS);
  private readonly searchState = signal('');
  private readonly sortState = signal<ProductGroupSortOption>('sortOrder');
  private readonly pageIndexState = signal(0);
  private readonly pageSizeState = signal(20);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set<string>());
  private readonly viewModeState = signal<ProductGroupViewMode>('table');
  private readonly lastUpdatedState = signal<string | null>(null);

  readonly groups = this.groupsState.asReadonly();
  readonly selectedGroup = this.selectedGroupState.asReadonly();
  readonly profitability = this.profitabilityState.asReadonly();
  readonly associatedProducts = this.associatedProductsState.asReadonly();
  readonly availableProducts = this.availableProductsState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly search = this.searchState.asReadonly();
  readonly sort = this.sortState.asReadonly();
  readonly pageIndex = this.pageIndexState.asReadonly();
  readonly pageSize = this.pageSizeState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();
  readonly viewMode = this.viewModeState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();

  readonly canCreate = computed(() =>
    this.permissionsService.has(PRODUCT_GROUPS_PERMISSIONS.create),
  );
  readonly canEdit = computed(() => this.permissionsService.has(PRODUCT_GROUPS_PERMISSIONS.update));
  readonly canArchive = computed(() =>
    this.permissionsService.has(PRODUCT_GROUPS_PERMISSIONS.update),
  );
  readonly canDelete = computed(() =>
    this.permissionsService.has(PRODUCT_GROUPS_PERMISSIONS.delete),
  );
  readonly canManageProducts = computed(() =>
    this.permissionsService.has(PRODUCT_GROUPS_PERMISSIONS.update),
  );
  readonly canViewStatistics = computed(() =>
    this.permissionsService.has(PRODUCT_GROUPS_PERMISSIONS.statistics),
  );

  readonly listItems = computed(() => this.groupsState().map(toProductGroupListItem));
  readonly totalGroups = computed(() => this.groupsState().length);
  readonly activeGroups = computed(
    () =>
      this.groupsState().filter((group) => resolveProductGroupStatus(group) === 'active').length,
  );
  readonly archivedGroups = computed(
    () =>
      this.groupsState().filter((group) => resolveProductGroupStatus(group) === 'archived').length,
  );
  readonly totalAssociatedProducts = computed(() =>
    this.groupsState().reduce((sum, group) => sum + group.productCount, 0),
  );
  readonly estimatedRevenue = computed(() =>
    this.groupsState().reduce((sum, group) => sum + group.estimatedRevenue, 0),
  );
  readonly estimatedProfit = computed(() =>
    this.groupsState().reduce((sum, group) => sum + group.estimatedProfit, 0),
  );
  readonly averageMargin = computed(() => {
    const groups = this.groupsState();
    return groups.length
      ? groups.reduce((sum, group) => sum + group.estimatedMargin, 0) / groups.length
      : 0;
  });

  readonly filteredGroups = computed(() => {
    const search = normalize(this.searchState());
    const filters = this.filtersState();
    const filtered = this.listItems().filter((group) => {
      const matchesSearch =
        !search ||
        normalize(`${group.name} ${group.code} ${group.description ?? ''}`).includes(search);
      const status = resolveProductGroupStatus(group);
      const matchesStatus = filters.status === 'all' || filters.status === status;
      const matchesFeatured =
        filters.featured === 'all' ||
        (filters.featured === 'featured' ? group.featured : !group.featured);
      const matchesRentability =
        filters.rentability === 'all' ||
        (filters.rentability === 'profitable' &&
          group.estimatedProfit >= 0 &&
          group.estimatedMargin >= 20) ||
        (filters.rentability === 'low-margin' &&
          group.estimatedProfit >= 0 &&
          group.estimatedMargin < 20) ||
        (filters.rentability === 'loss' && group.estimatedProfit < 0);

      return matchesSearch && matchesStatus && matchesFeatured && matchesRentability;
    });

    return sortGroups(filtered, this.sortState());
  });

  readonly hasGroups = computed(() => this.groupsState().length > 0);
  readonly hasSelection = computed(() => this.selectedIdsState().size > 0);
  readonly currentGroupProfit = computed(() => this.profitabilityState()?.estimatedProfit ?? 0);
  readonly currentGroupMargin = computed(() => this.profitabilityState()?.estimatedMargin ?? 0);

  loadGroups(): void {
    if (!this.permissionsService.has(PRODUCT_GROUPS_PERMISSIONS.read)) {
      this.errorState.set('No tienes permisos para consultar conjuntos.');
      return;
    }

    const importedOrders = this.importedOrdersStore.orders();
    if (importedOrders.length > 0) {
      this.applyImportedOrders(importedOrders);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    this.api
      .listGroups()
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (groups) => {
          this.groupsState.set(groups);
          this.lastUpdatedState.set(new Date().toISOString());
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  loadGroupDetail(id: string): void {
    const importedOrders = this.importedOrdersStore.orders();
    if (importedOrders.length > 0) {
      this.loadImportedGroupDetail(id, importedOrders);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    forkJoin({
      group: this.api.getGroup(id),
      products: this.api.groupProducts(id),
      profitability: this.canViewStatistics()
        ? this.api.profitability(id)
        : this.api.profitability(id),
      history: this.api.history(id),
    })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: ({ group, products, profitability, history }) => {
          this.selectedGroupState.set(group);
          this.associatedProductsState.set(products);
          this.profitabilityState.set(profitability);
          this.historyState.set(history);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  searchProducts(term: string): void {
    const importedOrders = this.importedOrdersStore.orders();
    if (importedOrders.length > 0) {
      const normalizedTerm = normalize(term);
      this.availableProductsState.set(
        toImportedProducts(importedOrders).filter((product) =>
          normalize(`${product.name} ${product.sku}`).includes(normalizedTerm),
        ),
      );
      return;
    }

    this.api.availableProducts(term).subscribe({
      next: (products) => this.availableProductsState.set(products),
      error: (error: Error) => this.errorState.set(error.message),
    });
  }

  create(payload: CreateProductGroupRequest, onSuccess: (group: ProductGroup) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .createGroup(payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (group) => {
          this.upsertGroup(group);
          onSuccess(group);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  update(
    id: string,
    payload: UpdateProductGroupRequest,
    onSuccess: (group: ProductGroup) => void,
  ): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateGroup(id, payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (group) => {
          this.upsertGroup(group);
          this.selectedGroupState.set(group);
          onSuccess(group);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  archive(id: string): void {
    this.mutateGroup(this.api.archiveGroup(id));
  }

  restore(id: string): void {
    this.mutateGroup(this.api.restoreGroup(id));
  }

  delete(id: string): void {
    this.deletingState.set(true);
    this.errorState.set(null);

    this.api
      .deleteGroup(id)
      .pipe(finalize(() => this.deletingState.set(false)))
      .subscribe({
        next: () => this.groupsState.update((groups) => groups.filter((group) => group.id !== id)),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  addProducts(id: string, payload: AssociateProductsRequest): void {
    this.mutateGroup(this.api.addProducts(id, payload), () => this.loadGroupDetail(id));
  }

  removeProduct(id: string, productId: string): void {
    this.mutateGroup(this.api.removeProduct(id, productId), () => this.loadGroupDetail(id));
  }

  reorderProducts(id: string, payload: ReorderProductsRequest): void {
    this.mutateGroup(this.api.reorderProducts(id, payload), () => this.loadGroupDetail(id));
  }

  applySearch(search: string): void {
    this.searchState.set(search);
    this.pageIndexState.set(0);
  }

  applyFilters(filters: ProductGroupFilters): void {
    this.filtersState.set(filters);
    this.pageIndexState.set(0);
  }

  clearFilters(): void {
    this.filtersState.set(DEFAULT_PRODUCT_GROUP_FILTERS);
    this.searchState.set('');
    this.pageIndexState.set(0);
  }

  setSort(sort: ProductGroupSortOption): void {
    this.sortState.set(sort);
  }

  setSelectedIds(groups: readonly ProductGroupListItem[]): void {
    this.selectedIdsState.set(new Set(groups.map((group) => group.id)));
  }

  setViewMode(mode: ProductGroupViewMode): void {
    this.viewModeState.set(mode);
  }

  private mutateGroup(
    source: ReturnType<ProductGroupsApiService['archiveGroup']>,
    after?: () => void,
  ): void {
    this.savingState.set(true);
    this.errorState.set(null);

    source.pipe(finalize(() => this.savingState.set(false))).subscribe({
      next: (group) => {
        this.upsertGroup(group);
        if (this.selectedGroupState()?.id === group.id) {
          this.selectedGroupState.set(group);
        }
        after?.();
      },
      error: (error: Error) => this.errorState.set(error.message),
    });
  }

  private applyImportedOrders(importedOrders: readonly DailyOrder[]): void {
    this.groupsState.set(toImportedProductGroups(importedOrders));
    this.availableProductsState.set(toImportedProducts(importedOrders));
    this.errorState.set(null);
    this.loadingState.set(false);
    this.lastUpdatedState.set(new Date().toISOString());
  }

  private loadImportedGroupDetail(id: string, importedOrders: readonly DailyOrder[]): void {
    const groups = toImportedProductGroups(importedOrders);
    const group = groups.find((item) => item.id === id) ?? null;

    this.selectedGroupState.set(group);
    this.associatedProductsState.set(toImportedProducts(importedOrders, id));
    this.availableProductsState.set(toImportedProducts(importedOrders));
    this.profitabilityState.set(toImportedProfitability(importedOrders, id));
    this.historyState.set([]);
    this.errorState.set(group ? null : 'No fue posible encontrar el conjunto importado.');
    this.loadingState.set(false);
    this.lastUpdatedState.set(new Date().toISOString());
  }

  private upsertGroup(group: ProductGroup): void {
    this.groupsState.update((groups) => {
      const exists = groups.some((item) => item.id === group.id);
      return exists
        ? groups.map((item) => (item.id === group.id ? group : item))
        : [group, ...groups];
    });
  }
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function sortGroups(
  groups: readonly ProductGroupListItem[],
  sort: ProductGroupSortOption,
): readonly ProductGroupListItem[] {
  return [...groups].sort((left, right) => {
    switch (sort) {
      case 'name':
        return left.name.localeCompare(right.name);
      case 'updatedAt':
        return right.updatedAt.localeCompare(left.updatedAt);
      case 'estimatedProfit':
        return right.estimatedProfit - left.estimatedProfit;
      case 'sortOrder':
        return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
    }
  });
}
