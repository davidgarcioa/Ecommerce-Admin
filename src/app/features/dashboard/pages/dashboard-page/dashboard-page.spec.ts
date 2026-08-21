import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DailyOrder } from '../../../daily-report/models/daily-order.model';
import { DashboardPageComponent } from './dashboard-page';

const IMPORTED_ORDERS_STORAGE_KEY = 'ecommerce-control-center.imported-orders';
const GUIDE_STORAGE_KEY = 'linkoba.dashboard.guideSegments';

describe('DashboardPageComponent', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    localStorage.setItem(IMPORTED_ORDERS_STORAGE_KEY, JSON.stringify(importedOrdersFixture()));

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem(IMPORTED_ORDERS_STORAGE_KEY);
    localStorage.removeItem(GUIDE_STORAGE_KEY);
  });

  it('should render dashboard page with imported orders', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Estado de guía');
    expect(compiled.textContent).toContain('Resumen general del día');
    expect(compiled.textContent).toContain('Todas las órdenes');
    expect(compiled.textContent).toContain('LK-0001');
    expect(compiled.textContent).toContain('6 de 6 órdenes');
    expect(compiled.querySelector('[data-testid="orders-filters"]')).toBeNull();
    expect(compiled.querySelectorAll('.donut-card .donut-chart')).toHaveLength(4);
  });

  it('should toggle the guide editor from the real edit button', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="guide-edit-button"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Editar estados de guía');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('should update filters from the real search input', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="orders-filter-button"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '[data-testid="order-search-input"]',
    ) as HTMLInputElement;
    input.value = 'Camila';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.filteredOrders()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Camila Torres');
    expect(fixture.nativeElement.textContent).not.toContain('Laura Méndez');
  });

  it('should filter orders by guide status', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;

    component.guideStatusFilter.set('Novedad');
    fixture.detectChanges();

    expect(component.filteredOrders()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Camila Torres');
  });

  it('should filter orders by date range', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;

    component.dateFromFilter.set('2026-08-18');
    component.dateToFilter.set('2026-08-19');
    fixture.detectChanges();

    expect(component.filteredOrders()).toHaveLength(3);
    expect(component.filteredOrders().every((row) => row.dateIso >= '2026-08-18')).toBe(true);
  });

  it('should toggle the orders filters from the real filter button', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="orders-filter-button"]',
    ) as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('[data-testid="orders-filters"]')).toBeNull();

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="orders-filters"]')).not.toBeNull();

    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="orders-filters"]')).toBeNull();
  });

  it('should update the selected guide status color', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;

    component.selectGuideSegment('novedad');
    component.updateSelectedGuideColor('#22c55e');
    fixture.detectChanges();

    expect(component.selectedGuideSegment().id).toBe('novedad');
    expect(component.guideStatusColor('Novedad')).toBe('#22c55e');
    expect(component.guideBackground()).toContain('#22c55e');
  });

  it('should hide a guide status from the donut from the real editor toggle', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector(
      '[data-testid="guide-edit-button"]',
    ) as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const cancelledToggle = fixture.nativeElement.querySelector(
      '[data-testid="guide-visibility-cancelada"]',
    ) as HTMLInputElement;
    cancelledToggle.checked = false;
    cancelledToggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const legend = fixture.nativeElement.querySelector(
      '.donut-card--guide .donut-card__legend',
    ) as HTMLElement;
    expect(component.visibleGuideSegments().some((segment) => segment.id === 'cancelada')).toBe(
      false,
    );
    expect(component.guideTotal()).toBe(5);
    expect(component.guideBackground()).not.toContain('#d99009');
    expect(legend.textContent).not.toContain('Cancelada');
  });

  it('should show a guide percentage only when hovering a real donut segment', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hoveredGuideSegment()).toBeNull();
    const guideCenter = fixture.nativeElement.querySelector(
      '.donut-card--guide .donut-card__center',
    ) as HTMLElement;
    expect(guideCenter.textContent).toContain('6');

    const segments = fixture.nativeElement.querySelectorAll('.donut-chart__segment--guide');
    segments[0].dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    expect(component.hoveredGuideSegment()?.id).toBe('guia-generada');
    expect(guideCenter.textContent).toContain('16,7 %');
  });
});

function importedOrdersFixture(): readonly DailyOrder[] {
  return [
    orderFixture({
      orderNumber: 'LK-0001',
      createdAt: '2026-08-19T09:00:00.000Z',
      guideNumber: 'GUIA890001',
      status: 'Entregada',
      guideStatus: 'Entregada',
      customerName: 'Laura Méndez',
      productName: 'Kit Skin Care Premium',
      productGroupName: 'Fyntra 2',
      city: 'Bogotá',
      carrier: 'Coordinadora',
      orderValue: 189000,
      estimatedProfit: 91300,
      urgent: false,
    }),
    orderFixture({
      orderNumber: 'LK-0002',
      createdAt: '2026-08-19T10:00:00.000Z',
      guideNumber: 'GUIA890002',
      status: 'En tránsito',
      guideStatus: 'En ruta',
      customerName: 'Carlos Rojas',
      productName: 'Organizador Modular',
      productGroupName: 'Helvor 2',
      city: 'Medellín',
      carrier: 'Servientrega',
      orderValue: 149000,
      estimatedProfit: 63700,
      urgent: false,
    }),
    orderFixture({
      orderNumber: 'LK-0003',
      createdAt: '2026-08-18T11:00:00.000Z',
      guideNumber: 'GUIA890003',
      status: 'Confirmada',
      guideStatus: 'GUIA_GENERADA',
      customerName: 'Natalia Pérez',
      productName: 'Audífonos Pro',
      productGroupName: 'Fondal',
      city: 'Cali',
      carrier: 'Envía',
      orderValue: 219000,
      estimatedProfit: 102900,
      urgent: true,
    }),
    orderFixture({
      orderNumber: 'LK-0004',
      createdAt: '2026-08-17T12:00:00.000Z',
      guideNumber: 'GUIA890004',
      status: 'Despachada',
      guideStatus: 'RECOGIDO POR DROPI',
      customerName: 'Andrés Soto',
      productName: 'Set Cocina Práctica',
      productGroupName: 'Gadrix 2',
      city: 'Barranquilla',
      carrier: 'TCC',
      orderValue: 176000,
      estimatedProfit: 78400,
      urgent: false,
    }),
    orderFixture({
      orderNumber: 'LK-0005',
      createdAt: '2026-08-16T13:00:00.000Z',
      guideNumber: 'GUIA890005',
      status: 'Devuelta',
      guideStatus: 'Novedad',
      customerName: 'Camila Torres',
      productName: 'Corrector Postural',
      productGroupName: 'Halcor',
      city: 'Bucaramanga',
      carrier: 'Inter Rapidísimo',
      orderValue: 132000,
      estimatedProfit: 34100,
      urgent: true,
    }),
    orderFixture({
      orderNumber: 'LK-0006',
      createdAt: '2026-08-15T14:00:00.000Z',
      guideNumber: 'GUIA890006',
      status: 'Cancelada',
      guideStatus: 'Cancelada',
      customerName: 'Felipe Gómez',
      productName: 'Lámpara LED Smart',
      productGroupName: 'Gemvia',
      city: 'Pereira',
      carrier: 'Coordinadora',
      orderValue: 158000,
      estimatedProfit: 0,
      urgent: false,
    }),
  ];
}

function orderFixture(order: {
  readonly orderNumber: string;
  readonly createdAt: string;
  readonly guideNumber: string;
  readonly status: DailyOrder['status'];
  readonly guideStatus: string;
  readonly customerName: string;
  readonly productName: string;
  readonly productGroupName: string;
  readonly city: string;
  readonly carrier: string;
  readonly orderValue: number;
  readonly estimatedProfit: number;
  readonly urgent: boolean;
}): DailyOrder {
  return {
    id: `dropi-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerPhone: '3000000000',
    productName: order.productName,
    productGroupId: order.productGroupName.toLowerCase().replace(/\s+/g, '-'),
    productGroupName: order.productGroupName,
    guideNumber: order.guideNumber,
    guideStatus: order.guideStatus,
    city: order.city,
    carrier: order.carrier,
    status: order.status,
    orderValue: order.orderValue,
    advertisingCost: 0,
    estimatedProfit: order.estimatedProfit,
    operationDays: 1,
    urgent: order.urgent,
    paymentMethod: 'Contraentrega',
    lastUpdated: order.createdAt,
  };
}
