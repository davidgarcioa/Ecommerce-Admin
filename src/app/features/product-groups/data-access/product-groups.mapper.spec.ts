import {
  resolveProductGroupStatus,
  resolveProfitabilityLabel,
  toProductGroupListItem,
} from './product-groups.mapper';
import { ProductGroup } from './product-groups.models';

const baseGroup: ProductGroup = {
  id: 'group-1',
  code: 'HELVOR-2',
  name: 'Helvor 2',
  slug: 'helvor-2',
  description: 'Conjunto principal',
  color: '#8A8A8A',
  icon: 'inventory_2',
  active: true,
  featured: true,
  sortOrder: 1,
  productCount: 2,
  campaignCount: 1,
  orderCount: 10,
  estimatedRevenue: 200000,
  estimatedCost: 120000,
  estimatedProfit: 80000,
  estimatedMargin: 40,
  productIds: ['product-1'],
  createdBy: 'admin',
  createdAt: '2026-07-29T10:00:00.000Z',
  updatedAt: '2026-07-29T11:00:00.000Z',
};

describe('product-groups mapper', () => {
  it('maps list item status and profitability', () => {
    const item = toProductGroupListItem(baseGroup);

    expect(item.status).toBe('active');
    expect(item.statusLabel).toBe('Activo');
    expect(item.profitabilityLabel).toBe('Rentable');
  });

  it('detects archived status', () => {
    expect(resolveProductGroupStatus({ ...baseGroup, archivedAt: '2026-07-29' })).toBe('archived');
  });

  it('detects low margin and loss profitability', () => {
    expect(resolveProfitabilityLabel(10, 1000)).toBe('Margen bajo');
    expect(resolveProfitabilityLabel(-5, -1000)).toBe('Pérdida');
  });
});
