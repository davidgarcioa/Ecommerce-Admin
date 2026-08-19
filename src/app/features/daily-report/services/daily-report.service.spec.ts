import { TestBed } from '@angular/core/testing';

import { DailyReportService } from './daily-report.service';

describe('DailyReportService', () => {
  let service: DailyReportService;
  const importedOrdersStorageKey = 'ecommerce-control-center.imported-orders';

  beforeEach(() => {
    localStorage.removeItem(importedOrdersStorageKey);
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyReportService);
  });

  afterEach(() => {
    localStorage.removeItem(importedOrdersStorageKey);
  });

  it('should load report data', () => {
    expect(service.report().summaryMetrics.length).toBe(12);
    expect(service.orders().length).toBeGreaterThanOrEqual(50);
  });

  it('should apply filters and change visible orders', () => {
    const initialCount = service.filteredOrders().length;

    service.applyFilters({ ...service.filters(), productGroupId: 'helvor-2' });

    expect(service.filteredOrders().length).toBeLessThan(initialCount);
  });

  it('should clear filters and restore orders', () => {
    service.applyFilters({ ...service.filters(), city: 'Bogotá' });
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

    expect(csv).toContain('Orden,Guía,Fecha,Cliente');
  });

  it('should rebuild dashboard data when imported storage contains invalid orders', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(importedOrdersStorageKey, JSON.stringify([null, { id: 'bad-order' }]));
    TestBed.configureTestingModule({});

    const stableService = TestBed.inject(DailyReportService);
    stableService.activateDashboardReport();

    expect(stableService.filteredOrders().length).toBeGreaterThanOrEqual(50);
    expect(stableService.summaryMetrics().length).toBe(12);
    expect(stableService.productGroupPerformance().length).toBeGreaterThan(0);
  });
});
