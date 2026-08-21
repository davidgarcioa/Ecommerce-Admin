import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { OfficeApiService } from './office-api.service';
import { orderFixture } from './office.fixtures';
import { OrderStatistics, PaginatedOrdersResponse } from './office.models';
import { OfficeStore } from './office.store';

const response: PaginatedOrdersResponse = {
  data: [orderFixture],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
  },
};

const statistics: OrderStatistics = {
  totalOrders: 1,
  sales: 131900,
  averageTicket: 131900,
  cancelled: 0,
  delivered: 0,
  inTransit: 0,
  urgent: 1,
  soldValue: 0,
  pendingValue: 131900,
};

describe('OfficeStore', () => {
  let store: OfficeStore;
  let api: {
    readonly listOrders: ReturnType<typeof vi.fn>;
    readonly getStatistics: ReturnType<typeof vi.fn>;
    readonly getOrder: ReturnType<typeof vi.fn>;
    readonly getHistory: ReturnType<typeof vi.fn>;
    readonly updateOrder: ReturnType<typeof vi.fn>;
    readonly updateOrderStatus: ReturnType<typeof vi.fn>;
    readonly updatePaymentStatus: ReturnType<typeof vi.fn>;
    readonly updateDeliveryStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();

    api = {
      listOrders: vi.fn(() => of(response)),
      getStatistics: vi.fn(() => of(statistics)),
      getOrder: vi.fn(() => of(orderFixture)),
      getHistory: vi.fn(() => of([])),
      updateOrder: vi.fn(() => of({ ...orderFixture, city: 'Medellin' })),
      updateOrderStatus: vi.fn(() => of({ ...orderFixture, orderStatus: 'Confirmed' })),
      updatePaymentStatus: vi.fn(() => of({ ...orderFixture, paymentStatus: 'Paid' })),
      updateDeliveryStatus: vi.fn(() => of({ ...orderFixture, deliveryStatus: 'Assigned' })),
    };

    TestBed.configureTestingModule({
      providers: [
        OfficeStore,
        { provide: OfficeApiService, useValue: api },
        { provide: PermissionsService, useValue: { has: () => true } },
      ],
    });
    store = TestBed.inject(OfficeStore);
  });

  it('loads orders and summary statistics', () => {
    store.loadOrders();

    expect(store.orders().length).toBe(1);
    expect(store.totalOrders()).toBe(1);
    expect(store.ordersWithNovelty()).toBe(1);
    expect(store.statistics().pendingValue).toBe(131900);
  });

  it('applies search and clears filters through the backend query', () => {
    store.applySearch('Laura');

    expect(api.listOrders).toHaveBeenCalled();
    expect(store.search()).toBe('Laura');

    store.clearFilters();
    expect(store.search()).toBe('');
  });

  it('loads order detail with history', () => {
    store.loadOrderDetail('order-1');

    expect(store.selectedOrder()?.id).toBe('order-1');
    expect(store.selectedCustomer()?.name).toBe('Laura Gomez');
  });

  it('updates order and status state', () => {
    store.loadOrders();
    store.updateOrder('order-1', { city: 'Medellin' });
    expect(store.selectedOrder()?.city).toBe('Medellin');

    api.getOrder.mockReturnValueOnce(of({ ...orderFixture, orderStatus: 'Confirmed' }));
    store.confirmOrder('order-1');
    expect(store.selectedOrder()?.orderStatus).toBe('Confirmed');
  });
});
