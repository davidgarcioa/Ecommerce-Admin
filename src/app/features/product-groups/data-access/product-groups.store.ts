import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { API_CONFIG, isStaticFrontendApi } from '../../../core/config/api.config';
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

const LOCAL_PRODUCT_GROUPS_STORAGE_KEY = 'ecommerce.product-groups.local.records';

@Injectable()
export class ProductGroupsStore {
  private readonly api = inject(ProductGroupsApiService);
  private readonly apiConfig = inject(API_CONFIG);
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

    if (this.isStaticMode()) {
      this.replaceGroups(readStoredGroups() ?? [], false);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    this.api
      .listGroups()
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (groups) => {
          const storedGroups = readStoredGroups();
          this.replaceGroups(storedGroups ?? groups, false);
        },
        error: () => {
          this.replaceGroups(readStoredGroups() ?? [], false);
        },
      });
  }

  loadGroupDetail(id: string): void {
    const importedOrders = this.importedOrdersStore.orders();
    if (importedOrders.length > 0) {
      this.loadImportedGroupDetail(id, importedOrders);
      return;
    }

    if (this.isStaticMode()) {
      this.loadLocalGroupDetail(id);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    this.selectedGroupState.set(this.findKnownGroup(id));

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
          const resolvedGroup = group ?? this.findKnownGroup(id);

          if (!resolvedGroup) {
            this.loadLocalGroupDetail(id);
            return;
          }

          this.selectedGroupState.set(resolvedGroup);
          this.associatedProductsState.set(
            products.length > 0 ? products : localProductsForGroup(resolvedGroup),
          );
          this.profitabilityState.set(profitability ?? localProfitabilityForGroup(resolvedGroup));
          this.historyState.set(history);
        },
        error: () => this.loadLocalGroupDetail(id),
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

    if (this.isStaticMode()) {
      const normalizedTerm = normalize(term);
      const storedProducts = (readStoredGroups() ?? []).flatMap(localProductsForGroup);

      this.availableProductsState.set(
        storedProducts.filter((product) =>
          normalize(`${product.name} ${product.sku}`).includes(normalizedTerm),
        ),
      );
      return;
    }

    this.api.availableProducts(term).subscribe({
      next: (products) => this.availableProductsState.set(products),
      error: () => {
        const normalizedTerm = normalize(term);
        const storedProducts = (readStoredGroups() ?? []).flatMap(localProductsForGroup);

        this.availableProductsState.set(
          storedProducts.filter((product) =>
            normalize(`${product.name} ${product.sku}`).includes(normalizedTerm),
          ),
        );
      },
    });
  }

  create(payload: CreateProductGroupRequest, onSuccess: (group: ProductGroup) => void): void {
    if (this.isStaticMode()) {
      const group = createLocalGroup(payload);

      this.upsertGroup(group, true);
      onSuccess(group);
      return;
    }

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .createGroup(payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (group) => {
          this.upsertGroup(group, true);
          onSuccess(group);
        },
        error: () => {
          const group = createLocalGroup(payload);

          this.upsertGroup(group, true);
          onSuccess(group);
        },
      });
  }

  update(
    id: string,
    payload: UpdateProductGroupRequest,
    onSuccess: (group: ProductGroup) => void,
  ): void {
    if (this.isStaticMode()) {
      const group = updateLocalGroup(this.findKnownGroup(id), payload);

      if (!group) {
        this.errorState.set('No se encontro el conjunto solicitado.');
        return;
      }

      this.upsertGroup(group, true);
      this.selectedGroupState.set(group);
      onSuccess(group);
      return;
    }

    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateGroup(id, payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (group) => {
          this.upsertGroup(group, true);
          this.selectedGroupState.set(group);
          onSuccess(group);
        },
        error: () => {
          const group = updateLocalGroup(this.findKnownGroup(id), payload);

          if (!group) {
            this.errorState.set('No se encontro el conjunto solicitado.');
            return;
          }

          this.upsertGroup(group, true);
          this.selectedGroupState.set(group);
          onSuccess(group);
        },
      });
  }

  archive(id: string): void {
    if (this.isStaticMode()) {
      this.applyLocalGroupMutation(id, archiveLocalGroup);
      return;
    }

    this.mutateGroup(id, this.api.archiveGroup(id), (group) => archiveLocalGroup(group));
  }

  restore(id: string): void {
    if (this.isStaticMode()) {
      this.applyLocalGroupMutation(id, restoreLocalGroup);
      return;
    }

    this.mutateGroup(id, this.api.restoreGroup(id), (group) => restoreLocalGroup(group));
  }

  delete(id: string): void {
    if (this.isStaticMode()) {
      this.removeGroup(id, true);
      return;
    }

    this.deletingState.set(true);
    this.errorState.set(null);

    this.api
      .deleteGroup(id)
      .pipe(finalize(() => this.deletingState.set(false)))
      .subscribe({
        next: () => this.removeGroup(id, true),
        error: () => this.removeGroup(id, true),
      });
  }

  addProducts(id: string, payload: AssociateProductsRequest): void {
    this.mutateGroup(
      id,
      this.api.addProducts(id, payload),
      (group) => addLocalProducts(group, payload.productIds),
      () => this.loadGroupDetail(id),
    );
  }

  removeProduct(id: string, productId: string): void {
    this.mutateGroup(
      id,
      this.api.removeProduct(id, productId),
      (group) => removeLocalProduct(group, productId),
      () => this.loadGroupDetail(id),
    );
  }

  reorderProducts(id: string, payload: ReorderProductsRequest): void {
    this.mutateGroup(
      id,
      this.api.reorderProducts(id, payload),
      (group) => reorderLocalProducts(group, payload.productIds),
      () => this.loadGroupDetail(id),
    );
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
    id: string,
    source: ReturnType<ProductGroupsApiService['archiveGroup']>,
    fallback: (group: ProductGroup) => ProductGroup,
    after?: () => void,
  ): void {
    if (this.isStaticMode()) {
      this.applyLocalGroupMutation(id, fallback);
      after?.();
      return;
    }

    this.savingState.set(true);
    this.errorState.set(null);

    source.pipe(finalize(() => this.savingState.set(false))).subscribe({
      next: (group) => {
        this.upsertGroup(group, true);
        if (this.selectedGroupState()?.id === group.id) {
          this.selectedGroupState.set(group);
        }
        after?.();
      },
      error: () => {
        const group = this.findKnownGroup(id);

        if (!group) {
          this.errorState.set('No se encontro el conjunto solicitado.');
          return;
        }

        const updatedGroup = fallback(group);

        this.upsertGroup(updatedGroup, true);
        if (this.selectedGroupState()?.id === updatedGroup.id) {
          this.selectedGroupState.set(updatedGroup);
        }
        this.associatedProductsState.set(localProductsForGroup(updatedGroup));
        this.profitabilityState.set(localProfitabilityForGroup(updatedGroup));
        after?.();
      },
    });
  }

  private applyLocalGroupMutation(
    id: string,
    transform: (group: ProductGroup) => ProductGroup,
  ): void {
    const group = this.findKnownGroup(id);

    if (!group) {
      this.errorState.set('No se encontro el conjunto solicitado.');
      return;
    }

    const updatedGroup = transform(group);

    this.upsertGroup(updatedGroup, true);
    if (this.selectedGroupState()?.id === updatedGroup.id) {
      this.selectedGroupState.set(updatedGroup);
    }
    this.associatedProductsState.set(localProductsForGroup(updatedGroup));
    this.profitabilityState.set(localProfitabilityForGroup(updatedGroup));
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

  private upsertGroup(group: ProductGroup, persist: boolean): void {
    const workingGroups = this.resolveWorkingGroups();
    const nextGroups = workingGroups.some((item) => item.id === group.id)
      ? workingGroups.map((item) => (item.id === group.id ? group : item))
      : [group, ...workingGroups];

    this.replaceGroups(nextGroups, persist);
  }

  private removeGroup(id: string, persist: boolean): void {
    this.replaceGroups(
      this.resolveWorkingGroups().filter((group) => group.id !== id),
      persist,
    );

    if (this.selectedGroupState()?.id === id) this.selectedGroupState.set(null);
  }

  private replaceGroups(groups: readonly ProductGroup[], persist: boolean): void {
    this.groupsState.set(groups);
    this.errorState.set(null);
    this.lastUpdatedState.set(new Date().toISOString());

    if (persist) persistGroups(groups);
  }

  private findKnownGroup(id: string): ProductGroup | null {
    return this.resolveWorkingGroups().find((group) => group.id === id) ?? null;
  }

  private resolveWorkingGroups(): readonly ProductGroup[] {
    return this.groupsState().length > 0 ? this.groupsState() : (readStoredGroups() ?? []);
  }

  private loadLocalGroupDetail(id: string): void {
    const group = this.findKnownGroup(id);

    this.selectedGroupState.set(group);
    this.associatedProductsState.set(group ? localProductsForGroup(group) : []);
    this.profitabilityState.set(group ? localProfitabilityForGroup(group) : null);
    this.historyState.set([]);
    this.errorState.set(group ? null : 'No se encontro el conjunto solicitado.');
    this.loadingState.set(false);
    this.lastUpdatedState.set(new Date().toISOString());
  }

  private isStaticMode(): boolean {
    return isStaticFrontendApi(this.apiConfig.baseUrl);
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

function createLocalGroup(payload: CreateProductGroupRequest): ProductGroup {
  const now = new Date().toISOString();
  const slug = toSlug(payload.name || payload.code);

  return {
    id: `group-${slug}-${Date.now()}`,
    code: payload.code,
    name: payload.name,
    slug,
    description: payload.description,
    color: payload.color,
    icon: payload.icon,
    active: payload.active ?? true,
    featured: payload.featured ?? false,
    sortOrder: payload.sortOrder ?? 0,
    productCount: payload.productIds?.length ?? 0,
    campaignCount: 0,
    orderCount: 0,
    estimatedRevenue: 0,
    estimatedCost: 0,
    estimatedProfit: 0,
    estimatedMargin: 0,
    productIds: payload.productIds ?? [],
    createdBy: 'Local',
    createdAt: now,
    updatedAt: now,
  };
}

function updateLocalGroup(
  group: ProductGroup | null,
  payload: UpdateProductGroupRequest,
): ProductGroup | null {
  if (!group) return null;

  return {
    ...group,
    name: payload.name ?? group.name,
    slug: payload.name ? toSlug(payload.name) : group.slug,
    description: 'description' in payload ? payload.description : group.description,
    color: payload.color ?? group.color,
    icon: payload.icon ?? group.icon,
    active: payload.active ?? group.active,
    featured: payload.featured ?? group.featured,
    sortOrder: payload.sortOrder ?? group.sortOrder,
    updatedBy: 'Local',
    updatedAt: new Date().toISOString(),
  };
}

function archiveLocalGroup(group: ProductGroup): ProductGroup {
  const now = new Date().toISOString();

  return {
    ...group,
    active: false,
    archivedAt: now,
    updatedBy: 'Local',
    updatedAt: now,
  };
}

function restoreLocalGroup(group: ProductGroup): ProductGroup {
  return {
    ...group,
    active: true,
    archivedAt: undefined,
    updatedBy: 'Local',
    updatedAt: new Date().toISOString(),
  };
}

function addLocalProducts(group: ProductGroup, productIds: readonly string[]): ProductGroup {
  const nextIds = [...new Set([...group.productIds, ...productIds])];

  return recalculateLocalGroup({ ...group, productIds: nextIds });
}

function removeLocalProduct(group: ProductGroup, productId: string): ProductGroup {
  return recalculateLocalGroup({
    ...group,
    productIds: group.productIds.filter((id) => id !== productId),
  });
}

function reorderLocalProducts(group: ProductGroup, productIds: readonly string[]): ProductGroup {
  const knownIds = new Set(group.productIds);
  const orderedIds = productIds.filter((id) => knownIds.has(id));

  return { ...group, productIds: orderedIds, updatedAt: new Date().toISOString() };
}

function recalculateLocalGroup(group: ProductGroup): ProductGroup {
  const products = localProductsForGroup(group);
  const estimatedRevenue = products.reduce((sum, product) => sum + product.salePrice, 0);
  const estimatedCost = products.reduce((sum, product) => sum + product.estimatedTotalCost, 0);
  const estimatedProfit = estimatedRevenue - estimatedCost;

  return {
    ...group,
    productCount: products.length,
    estimatedRevenue,
    estimatedCost,
    estimatedProfit,
    estimatedMargin: estimatedRevenue > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0,
    updatedBy: 'Local',
    updatedAt: new Date().toISOString(),
  };
}

function localProductsForGroup(group: ProductGroup): readonly ProductGroupProduct[] {
  void group;
  return [];
}

function localProfitabilityForGroup(group: ProductGroup): ProductGroupProfitability {
  return {
    groupId: group.id,
    estimatedRevenue: group.estimatedRevenue,
    estimatedCost: group.estimatedCost,
    estimatedProfit: group.estimatedProfit,
    estimatedMargin: group.estimatedMargin,
    productCount: group.productCount,
  };
}

function readStoredGroups(): readonly ProductGroup[] | null {
  try {
    const rawGroups = globalThis.localStorage?.getItem(LOCAL_PRODUCT_GROUPS_STORAGE_KEY);

    if (!rawGroups) return null;

    const parsedGroups: unknown = JSON.parse(rawGroups);

    if (!Array.isArray(parsedGroups)) return null;

    return parsedGroups.filter(isProductGroup);
  } catch {
    return null;
  }
}

function persistGroups(groups: readonly ProductGroup[]): void {
  try {
    globalThis.localStorage?.setItem(LOCAL_PRODUCT_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch {
    return;
  }
}

function isProductGroup(value: unknown): value is ProductGroup {
  if (!value || typeof value !== 'object') return false;

  const group = value as Partial<ProductGroup>;

  return (
    typeof group.id === 'string' &&
    typeof group.code === 'string' &&
    typeof group.name === 'string' &&
    typeof group.slug === 'string' &&
    typeof group.color === 'string' &&
    typeof group.icon === 'string' &&
    typeof group.active === 'boolean' &&
    typeof group.featured === 'boolean' &&
    typeof group.sortOrder === 'number' &&
    typeof group.productCount === 'number' &&
    Array.isArray(group.productIds) &&
    typeof group.createdBy === 'string' &&
    typeof group.createdAt === 'string' &&
    typeof group.updatedAt === 'string'
  );
}

function toSlug(value: string): string {
  return (
    normalize(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'conjunto'
  );
}
