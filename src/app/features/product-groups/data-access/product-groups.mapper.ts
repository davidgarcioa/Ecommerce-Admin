import {
  ProductGroup,
  ProductGroupListItem,
  ProductGroupProduct,
  ProductGroupStatus,
} from './product-groups.models';

export function toProductGroupListItem(group: ProductGroup): ProductGroupListItem {
  const status = resolveProductGroupStatus(group);

  return {
    ...group,
    status,
    statusLabel: resolveProductGroupStatusLabel(status),
    profitabilityLabel: resolveProfitabilityLabel(group.estimatedMargin, group.estimatedProfit),
  };
}

export function resolveProductGroupStatus(group: ProductGroup): ProductGroupStatus {
  if (group.archivedAt) {
    return 'archived';
  }

  return group.active ? 'active' : 'inactive';
}

export function resolveProductGroupStatusLabel(status: ProductGroupStatus): string {
  const labels: Record<ProductGroupStatus, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    archived: 'Archivado',
  };

  return labels[status];
}

export function resolveProfitabilityLabel(margin: number, profit: number): string {
  if (profit < 0) {
    return 'Pérdida';
  }

  if (margin < 20) {
    return 'Margen bajo';
  }

  return 'Rentable';
}

export function isProductGroupProduct(
  value: ProductGroupProduct | null,
): value is ProductGroupProduct {
  return value !== null;
}
