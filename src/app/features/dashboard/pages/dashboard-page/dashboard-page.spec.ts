import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardPageComponent } from './dashboard-page';

describe('DashboardPageComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('linkoba.dashboard.guideSegments');

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render dashboard page', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Estado de guía');
    expect(compiled.textContent).toContain('Resumen general del día');
    expect(compiled.textContent).toContain('Todas las órdenes');
    expect(compiled.querySelector('[data-testid="orders-filters"]')).toBeNull();
    expect(compiled.querySelectorAll('.donut-card .donut-chart')).toHaveLength(4);
  });

  it('should toggle the guide editor from the real edit button', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="guide-edit-button"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Editar estados de guía');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('should update filters from the real search input', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="orders-filter-button"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('[data-testid="order-search-input"]') as HTMLInputElement;
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

    const button = fixture.nativeElement.querySelector('[data-testid="orders-filter-button"]') as HTMLButtonElement;
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

    component.selectGuideSegment('issue');
    component.updateSelectedGuideColor('#22c55e');
    fixture.detectChanges();

    expect(component.selectedGuideSegment().id).toBe('issue');
    expect(component.guideStatusColor('Novedad')).toBe('#22c55e');
    expect(component.guideBackground()).toContain('#22c55e');
  });

  it('should hide a guide status from the donut from the real editor toggle', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('[data-testid="guide-edit-button"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const cancelledToggle = fixture.nativeElement.querySelector('[data-testid="guide-visibility-cancelled"]') as HTMLInputElement;
    cancelledToggle.checked = false;
    cancelledToggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const legend = fixture.nativeElement.querySelector('.donut-card__legend') as HTMLElement;
    expect(component.visibleGuideSegments().some((segment) => segment.id === 'cancelled')).toBe(false);
    expect(component.guideTotal()).toBe(231);
    expect(component.guideBackground()).not.toContain('#d99009');
    expect(legend.textContent).not.toContain('Cancelada');
  });

  it('should show a guide percentage only when hovering a real donut segment', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hoveredGuideSegment()).toBeNull();
    const guideCenter = fixture.nativeElement.querySelector('.donut-card--guide .donut-card__center') as HTMLElement;
    expect(guideCenter.textContent).toContain('239');

    const segments = fixture.nativeElement.querySelectorAll('.donut-chart__segment--guide');
    segments[0].dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    expect(component.hoveredGuideSegment()?.id).toBe('generated');
    expect(guideCenter.textContent).toContain('7,1 %');
  });
});
