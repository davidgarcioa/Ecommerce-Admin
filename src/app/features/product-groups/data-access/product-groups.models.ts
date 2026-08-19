export type ProductGroupStatus = 'active' | 'inactive' | 'archived';
export type ProductGroupViewMode = 'table' | 'cards';
export type ProductGroupRentabilityFilter = 'all' | 'profitable' | 'low-margin' | 'loss';
export type ProductGroupSortOption = 'sortOrder' | 'name' | 'updatedAt' | 'estimatedProfit';
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'discontinued';
export type ProductCurrency = 'COP' | 'USD';

export interface ProductGroup {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly color: string;
  readonly icon: string;
  readonly active: boolean;
  readonly featured: boolean;
  readonly sortOrder: number;
  readonly productCount: number;
  readonly campaignCount: number;
  readonly orderCount: number;
  readonly estimatedRevenue: number;
  readonly estimatedCost: number;
  readonly estimatedProfit: number;
  readonly estimatedMargin: number;
  readonly productIds: readonly string[];
  readonly archivedAt?: string;
  readonly deletedAt?: string;
  readonly createdBy: string;
  readonly updatedBy?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProductGroupListItem extends ProductGroup {
  readonly status: ProductGroupStatus;
  readonly statusLabel: string;
  readonly profitabilityLabel: string;
}

export type ProductGroupDetail = ProductGroup;

export interface ProductGroupProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly status: ProductStatus;
  readonly currency: ProductCurrency;
  readonly salePrice: number;
  readonly unitCost: number;
  readonly estimatedTotalCost: number;
  readonly estimatedProfit: number;
  readonly estimatedProfitMargin: number;
  readonly active: boolean;
  readonly featured: boolean;
  readonly hasVariants: boolean;
  readonly variantCount: number;
  readonly updatedAt: string;
}

export interface ProductGroupStatistics {
  readonly total: number;
  readonly active: number;
  readonly archived: number;
  readonly associatedProducts: number;
  readonly estimatedRevenue: number;
  readonly estimatedCost: number;
  readonly estimatedProfit: number;
  readonly averageMargin: number;
}

export interface ProductGroupProfitability {
  readonly groupId: string;
  readonly estimatedRevenue: number;
  readonly estimatedCost: number;
  readonly estimatedProfit: number;
  readonly estimatedMargin: number;
  readonly productCount: number;
}

export interface ProductGroupHistoryEntry {
  readonly id: string;
  readonly groupId: string;
  readonly action: ProductGroupHistoryAction;
  readonly changedBy: string;
  readonly previousValue?: Record<string, unknown>;
  readonly nextValue?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ProductGroupHistoryAction =
  | 'GROUP_CREATED'
  | 'GROUP_UPDATED'
  | 'GROUP_ARCHIVED'
  | 'GROUP_RESTORED'
  | 'GROUP_DELETED'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_REMOVED';

export interface ProductListResult {
  readonly data: readonly ProductGroupProduct[];
  readonly meta: {
    readonly limit: number;
    readonly total: number;
    readonly nextCursor: string | null;
    readonly hasNextPage: boolean;
  };
}

export interface CreateProductGroupRequest {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly color: string;
  readonly icon: string;
  readonly active?: boolean;
  readonly featured?: boolean;
  readonly sortOrder?: number;
  readonly productIds?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateProductGroupRequest {
  readonly name?: string;
  readonly description?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly active?: boolean;
  readonly featured?: boolean;
  readonly sortOrder?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface AssociateProductsRequest {
  readonly productIds: readonly string[];
}

export interface ReorderProductsRequest {
  readonly productIds: readonly string[];
}

export interface ProductGroupFilters {
  readonly status: ProductGroupStatus | 'all';
  readonly featured: 'all' | 'featured' | 'standard';
  readonly rentability: ProductGroupRentabilityFilter;
}

export interface ProductGroupQuery {
  readonly search: string;
  readonly filters: ProductGroupFilters;
  readonly sort: ProductGroupSortOption;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface PaginatedProductGroupsResponse {
  readonly data: readonly ProductGroupListItem[];
  readonly total: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface ProductGroupFormValue {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly icon: string;
  readonly active: boolean;
  readonly featured: boolean;
  readonly sortOrder: number;
}
