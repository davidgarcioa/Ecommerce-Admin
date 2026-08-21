import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { ProductGroupsApiService } from './product-groups-api.service';
import {
  ProductGroup,
  ProductGroupProduct,
  ProductGroupProfitability,
} from './product-groups.models';
import { ProductGroupsStore } from './product-groups.store';

const group: ProductGroup = {
  id: 'group-1',
  code: 'HELVOR-2',
  name: 'Helvor 2',
  slug: 'helvor-2',
  color: '#8A8A8A',
  icon: 'inventory_2',
  active: true,
  featured: true,
  sortOrder: 1,
  productCount: 1,
  campaignCount: 0,
  orderCount: 0,
  estimatedRevenue: 100000,
  estimatedCost: 70000,
  estimatedProfit: 30000,
  estimatedMargin: 30,
  productIds: ['product-1'],
  createdBy: 'admin',
  createdAt: '2026-07-29T10:00:00.000Z',
  updatedAt: '2026-07-29T11:00:00.000Z',
};

const product: ProductGroupProduct = {
  id: 'product-1',
  sku: 'SKU-1',
  name: 'Producto uno',
  status: 'active',
  currency: 'COP',
  salePrice: 100000,
  unitCost: 50000,
  estimatedTotalCost: 70000,
  estimatedProfit: 30000,
  estimatedProfitMargin: 30,
  active: true,
  featured: false,
  hasVariants: false,
  variantCount: 0,
  updatedAt: '2026-07-29T11:00:00.000Z',
};

const profitability: ProductGroupProfitability = {
  groupId: 'group-1',
  estimatedRevenue: 100000,
  estimatedCost: 70000,
  estimatedProfit: 30000,
  estimatedMargin: 30,
  productCount: 1,
};

describe('ProductGroupsStore', () => {
  let store: ProductGroupsStore;
  let apiStub: {
    listGroups: ReturnType<typeof vi.fn>;
    getGroup: ReturnType<typeof vi.fn>;
    groupProducts: ReturnType<typeof vi.fn>;
    profitability: ReturnType<typeof vi.fn>;
    history: ReturnType<typeof vi.fn>;
    availableProducts: ReturnType<typeof vi.fn>;
    createGroup: ReturnType<typeof vi.fn>;
    updateGroup: ReturnType<typeof vi.fn>;
    archiveGroup: ReturnType<typeof vi.fn>;
    restoreGroup: ReturnType<typeof vi.fn>;
    deleteGroup: ReturnType<typeof vi.fn>;
    addProducts: ReturnType<typeof vi.fn>;
    removeProduct: ReturnType<typeof vi.fn>;
    reorderProducts: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    globalThis.localStorage?.clear();

    apiStub = {
      listGroups: vi.fn(() => of([group])),
      getGroup: vi.fn(() => of(group)),
      groupProducts: vi.fn(() => of([product])),
      profitability: vi.fn(() => of(profitability)),
      history: vi.fn(() => of([])),
      availableProducts: vi.fn(() => of([product])),
      createGroup: vi.fn(() => of(group)),
      updateGroup: vi.fn(() => of({ ...group, name: 'Editado' })),
      archiveGroup: vi.fn(() => of({ ...group, active: false, archivedAt: '2026-07-29' })),
      restoreGroup: vi.fn(() => of(group)),
      deleteGroup: vi.fn(() => of(undefined)),
      addProducts: vi.fn(() => of(group)),
      removeProduct: vi.fn(() => of(group)),
      reorderProducts: vi.fn(() => of(group)),
    };

    TestBed.configureTestingModule({
      providers: [
        ProductGroupsStore,
        { provide: ProductGroupsApiService, useValue: apiStub },
        { provide: PermissionsService, useValue: { has: () => true } },
      ],
    });
    store = TestBed.inject(ProductGroupsStore);
  });

  afterEach(() => {
    globalThis.localStorage?.clear();
  });

  it('loads groups and computes summary', () => {
    store.loadGroups();

    expect(store.groups().length).toBe(1);
    expect(store.totalGroups()).toBe(1);
    expect(store.activeGroups()).toBe(1);
    expect(store.estimatedProfit()).toBe(30000);
  });

  it('keeps a clean empty state when the API does not respond and no local groups exist', () => {
    apiStub.listGroups.mockReturnValueOnce(throwError(() => new Error('API unavailable')));

    store.loadGroups();

    expect(store.groups().length).toBe(0);
    expect(store.error()).toBeNull();
  });

  it('filters by search and clears filters', () => {
    store.loadGroups();
    store.applySearch('helvor');
    expect(store.filteredGroups().length).toBe(1);

    store.applySearch('no existe');
    expect(store.filteredGroups().length).toBe(0);

    store.clearFilters();
    expect(store.search()).toBe('');
    expect(store.filteredGroups().length).toBe(1);
  });

  it('loads detail with products and profitability', () => {
    store.loadGroupDetail('group-1');

    expect(store.selectedGroup()?.id).toBe('group-1');
    expect(store.associatedProducts().length).toBe(1);
    expect(store.currentGroupMargin()).toBe(30);
  });

  it('updates group state after archive and restore', () => {
    store.loadGroups();
    store.archive('group-1');
    expect(store.archivedGroups()).toBe(1);

    store.restore('group-1');
    expect(store.activeGroups()).toBe(1);
  });
});
