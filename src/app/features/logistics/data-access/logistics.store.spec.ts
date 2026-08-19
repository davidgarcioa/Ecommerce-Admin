import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { logisticsOrderFixture } from './logistics.fixtures';
import { LogisticsApiService, PaginatedLogisticsOrdersResponse } from './logistics-api.service';
import { LogisticsStatistics } from './logistics.models';
import { LogisticsStore } from './logistics.store';

const response: PaginatedLogisticsOrdersResponse = {
  data: [logisticsOrderFixture],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
  },
};

const statistics: LogisticsStatistics = {
  totalOrders: 1,
  sales: 0,
  averageTicket: 0,
  cancelled: 0,
  delivered: 0,
  inTransit: 0,
  urgent: 1,
  soldValue: 0,
  pendingValue: 131900,
};

describe('LogisticsStore', () => {
  let store: LogisticsStore;
  let api: {
    readonly listOrders: ReturnType<typeof vi.fn>;
    readonly getStatistics: ReturnType<typeof vi.fn>;
    readonly getOrder: ReturnType<typeof vi.fn>;
    readonly getOrderHistory: ReturnType<typeof vi.fn>;
    readonly updateShipment: ReturnType<typeof vi.fn>;
    readonly updateDeliveryStatus: ReturnType<typeof vi.fn>;
    readonly listDeliveries: ReturnType<typeof vi.fn>;
    readonly listReturns: ReturnType<typeof vi.fn>;
    readonly getReturn: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      listOrders: vi.fn(() => of(response)),
      getStatistics: vi.fn(() => of(statistics)),
      getOrder: vi.fn(() => of(logisticsOrderFixture)),
      getOrderHistory: vi.fn(() => of([])),
      updateShipment: vi.fn(() => of({ ...logisticsOrderFixture, trackingNumber: 'GUIA-1' })),
      updateDeliveryStatus: vi.fn(() =>
        of({ ...logisticsOrderFixture, deliveryStatus: 'Assigned' }),
      ),
      listDeliveries: vi.fn(() => of([])),
      listReturns: vi.fn(() => of([])),
      getReturn: vi.fn(() => of(null)),
    };

    TestBed.configureTestingModule({
      providers: [
        LogisticsStore,
        { provide: LogisticsApiService, useValue: api },
        { provide: PermissionsService, useValue: { has: () => true } },
      ],
    });
    store = TestBed.inject(LogisticsStore);
  });

  it('loads logistics orders and computes summary', () => {
    store.loadOrders();

    expect(store.orders().length).toBe(1);
    expect(store.pendingDispatches()).toBe(1);
    expect(store.ordersWithIncidents()).toBe(1);
  });

  it('applies search and local filters', () => {
    store.applySearch('Laura');
    expect(api.listOrders).toHaveBeenCalled();
    expect(store.search()).toBe('Laura');

    store.applyFilters({ ...store.filters(), withoutTracking: true });
    expect(store.filteredOrders().length).toBe(1);
  });

  it('loads detail and updates shipment information', () => {
    store.loadDetail('order-1');
    expect(store.selectedOrder()?.id).toBe('order-1');

    store.updateShipment('order-1', { trackingNumber: 'GUIA-1' });
    expect(store.selectedOrder()?.trackingNumber).toBe('GUIA-1');
  });

  it('updates delivery status using real order endpoint', () => {
    store.updateDeliveryStatus('order-1', { deliveryStatus: 'Assigned' });

    expect(api.updateDeliveryStatus).toHaveBeenCalledWith('order-1', {
      deliveryStatus: 'Assigned',
    });
  });
});
