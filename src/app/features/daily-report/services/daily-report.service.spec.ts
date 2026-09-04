import { TestBed } from '@angular/core/testing';

import { accountScopedStorageKey } from '../../../core/services/account-storage.service';
import { DailyOrder } from '../models/daily-order.model';
import { DailyReportService } from './daily-report.service';

const importedOrders: readonly DailyOrder[] = [
  {
    id: 'order-1',
    orderNumber: 'LK-0001',
    createdAt: '2026-08-21T08:00:00.000Z',
    reportDate: '2026-08-21',
    orderHour: '08:00',
    customerName: 'Laura Mendez',
    customerPhone: '3001000001',
    productName: 'Organizador Modular',
    productGroupId: 'helvor-2',
    productGroupName: 'Helvor 2',
    guideNumber: 'GUIA0001',
    guideStatus: 'Entregada',
    city: 'Bogota',
    carrier: 'Coordinadora',
    status: 'Entregada',
    orderValue: 180000,
    advertisingCost: 30000,
    estimatedProfit: 80000,
    shippingCost: 12000,
    commission: 5400,
    providerCostTotal: 52000,
    operationDays: 1,
    urgent: false,
    paymentMethod: 'Contraentrega',
    lastUpdated: '2026-08-21T09:00:00.000Z',
  },
  {
    id: 'order-2',
    orderNumber: 'LK-0002',
    createdAt: '2026-08-21T09:00:00.000Z',
    reportDate: '2026-08-21',
    orderHour: '09:00',
    customerName: 'Carlos Rojas',
    customerPhone: '3001000002',
    productName: 'Kit Skin Care Premium',
    productGroupId: 'fyntra-2',
    productGroupName: 'Fyntra 2',
    guideNumber: 'GUIA0002',
    guideStatus: 'En ruta',
    city: 'Medellin',
    carrier: 'Servientrega',
    status: 'En tránsito',
    orderValue: 150000,
    advertisingCost: 22000,
    estimatedProfit: 60000,
    shippingCost: 11000,
    commission: 4500,
    providerCostTotal: 52000,
    operationDays: 2,
    urgent: true,
    paymentMethod: 'Transferencia',
    lastUpdated: '2026-08-21T09:30:00.000Z',
  },
];

describe('DailyReportService', () => {
  let service: DailyReportService;
  const importedOrdersStorageKey = accountScopedStorageKey(
    'ecommerce-control-center.imported-orders',
  );

  beforeEach(() => {
    localStorage.setItem(importedOrdersStorageKey, JSON.stringify(importedOrders));
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyReportService);
  });

  afterEach(() => {
    localStorage.removeItem(importedOrdersStorageKey);
  });

  it('should load report data from imported orders', () => {
    expect(service.report().summaryMetrics.length).toBe(12);
    expect(service.orders().length).toBe(2);
  });

  it('should apply filters and change visible orders', () => {
    const initialCount = service.filteredOrders().length;

    service.applyFilters({ ...service.filters(), productGroupId: 'helvor-2' });

    expect(service.filteredOrders().length).toBeLessThan(initialCount);
  });

  it('should clear filters and restore orders', () => {
    service.applyFilters({ ...service.filters(), city: 'Bogota' });
    service.clearFilters();

    expect(service.filters().city).toBe('Todas');
    expect(service.filteredOrders().length).toBe(service.orders().length);
  });

  it('should toggle comparison', () => {
    const initial = service.comparisonEnabled();

    service.toggleComparison();

    expect(service.comparisonEnabled()).toBe(!initial);
  });

  it('should update order status and urgent flag', () => {
    const order = service.orders()[0];

    service.updateOrderStatus(order.id, 'Entregada');
    service.toggleUrgent(order.id);

    const updated = service.orders().find((item) => item.id === order.id);
    expect(updated?.status).toBe('Entregada');
    expect(updated?.urgent).toBe(!order.urgent);
  });

  it('should export csv content', () => {
    const csv = service.exportReport({
      format: 'csv',
      content: 'orders',
      filteredOnly: true,
      includeGeneratedAt: true,
      includeHiddenColumns: false,
    });

    expect(csv).toContain('Orden');
    expect(csv).toContain('Cliente');
  });

  it('should keep dashboard data empty when imported storage contains invalid orders', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(importedOrdersStorageKey, JSON.stringify([null, { id: 'bad-order' }]));
    TestBed.configureTestingModule({});

    const stableService = TestBed.inject(DailyReportService);
    stableService.activateDashboardReport();

    expect(stableService.filteredOrders().length).toBe(0);
    expect(stableService.summaryMetrics().length).toBe(12);
    expect(stableService.productGroupPerformance().length).toBe(0);
  });
});
