import { DailyOrder } from '../../daily-report/models/daily-order.model';
import {
  ProductGroup,
  ProductGroupProduct,
  ProductGroupProfitability,
} from './product-groups.models';

const IMPORT_AUTHOR = 'importacion-dropi';
const DEFAULT_COLOR = '#3B82F6';

interface ProductGroupAccumulator {
  readonly id: string;
  readonly name: string;
  readonly productIds: Set<string>;
  readonly products: Map<string, ProductGroupProduct>;
  orderCount: number;
  estimatedRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  createdAt: string;
  updatedAt: string;
}

export function toImportedProductGroups(orders: readonly DailyOrder[]): readonly ProductGroup[] {
  const groups = buildGroupAccumulators(orders);

  return Array.from(groups.values()).map((group, index) => {
    const productIds = Array.from(group.productIds);
    const estimatedMargin =
      group.estimatedRevenue > 0 ? (group.estimatedProfit / group.estimatedRevenue) * 100 : 0;

    return {
      id: group.id,
      code: group.id.toUpperCase(),
      name: group.name,
      slug: group.id,
      description: `Importado desde órdenes de Dropi.`,
      color: DEFAULT_COLOR,
      icon: 'inventory_2',
      active: true,
      featured: index < 3,
      sortOrder: index + 1,
      productCount: productIds.length,
      campaignCount: 0,
      orderCount: group.orderCount,
      estimatedRevenue: group.estimatedRevenue,
      estimatedCost: group.estimatedCost,
      estimatedProfit: group.estimatedProfit,
      estimatedMargin,
      productIds,
      createdBy: IMPORT_AUTHOR,
      updatedBy: IMPORT_AUTHOR,
      metadata: {
        source: 'dropi-import',
      },
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  });
}

export function toImportedProducts(
  orders: readonly DailyOrder[],
  groupId?: string,
): readonly ProductGroupProduct[] {
  const groups = buildGroupAccumulators(orders);
  const products = groupId
    ? Array.from(groups.get(groupId)?.products.values() ?? [])
    : Array.from(groups.values()).flatMap((group) => Array.from(group.products.values()));

  return products.sort((left, right) => left.name.localeCompare(right.name));
}

export function toImportedProfitability(
  orders: readonly DailyOrder[],
  groupId: string,
): ProductGroupProfitability | null {
  const group = buildGroupAccumulators(orders).get(groupId);
  if (!group) return null;

  const productCount = group.productIds.size;
  return {
    groupId,
    estimatedRevenue: group.estimatedRevenue,
    estimatedCost: group.estimatedCost,
    estimatedProfit: group.estimatedProfit,
    estimatedMargin:
      group.estimatedRevenue > 0 ? (group.estimatedProfit / group.estimatedRevenue) * 100 : 0,
    productCount,
  };
}

function buildGroupAccumulators(
  orders: readonly DailyOrder[],
): ReadonlyMap<string, ProductGroupAccumulator> {
  const groups = new Map<string, ProductGroupAccumulator>();

  orders.forEach((order) => {
    const groupId = order.productGroupId || toSlug(order.productGroupName || order.productName);
    const group = getOrCreateGroup(groups, groupId, order);
    const productId = order.productId || order.sku || toSlug(order.productName);
    const estimatedRevenue = Math.max(0, order.orderValue);
    const estimatedCost =
      Math.max(0, order.providerCostTotal ?? 0) +
      Math.max(0, order.shippingCost ?? 0) +
      Math.max(0, order.returnShippingCost ?? 0) +
      Math.max(0, order.commission ?? 0);
    const estimatedProfit = order.estimatedProfit || Math.max(0, estimatedRevenue - estimatedCost);

    group.productIds.add(productId);
    group.products.set(
      productId,
      toImportedProduct(order, productId, estimatedRevenue, estimatedCost),
    );
    group.orderCount += 1;
    group.estimatedRevenue += estimatedRevenue;
    group.estimatedCost += estimatedCost;
    group.estimatedProfit += estimatedProfit;
    group.createdAt = minIso(group.createdAt, order.createdAt);
    group.updatedAt = maxIso(group.updatedAt, order.lastUpdated || order.createdAt);
  });

  return groups;
}

function getOrCreateGroup(
  groups: Map<string, ProductGroupAccumulator>,
  groupId: string,
  order: DailyOrder,
): ProductGroupAccumulator {
  const current = groups.get(groupId);
  if (current) return current;

  const group: ProductGroupAccumulator = {
    id: groupId,
    name: order.productGroupName || order.productName,
    productIds: new Set<string>(),
    products: new Map<string, ProductGroupProduct>(),
    orderCount: 0,
    estimatedRevenue: 0,
    estimatedCost: 0,
    estimatedProfit: 0,
    createdAt: order.createdAt,
    updatedAt: order.lastUpdated || order.createdAt,
  };
  groups.set(groupId, group);
  return group;
}

function toImportedProduct(
  order: DailyOrder,
  productId: string,
  estimatedRevenue: number,
  estimatedCost: number,
): ProductGroupProduct {
  const estimatedProfit = order.estimatedProfit || Math.max(0, estimatedRevenue - estimatedCost);
  return {
    id: productId,
    sku: order.sku || productId,
    name: order.productName,
    status: 'active',
    currency: 'COP',
    salePrice: estimatedRevenue,
    unitCost: Math.max(0, order.providerCost ?? 0),
    estimatedTotalCost: estimatedCost,
    estimatedProfit,
    estimatedProfitMargin: estimatedRevenue > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0,
    active: true,
    featured: false,
    hasVariants: Boolean(order.variation),
    variantCount: order.variation ? 1 : 0,
    updatedAt: order.lastUpdated || order.createdAt,
  };
}

function toSlug(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'sin-conjunto'
  );
}

function minIso(left: string, right: string): string {
  return left <= right ? left : right;
}

function maxIso(left: string, right: string): string {
  return left >= right ? left : right;
}
