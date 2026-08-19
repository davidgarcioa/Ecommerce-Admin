import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMetric } from '../../models/dashboard-metric.model';
import { MetricCardComponent } from './metric-card';

describe('MetricCardComponent', () => {
  let fixture: ComponentFixture<MetricCardComponent>;

  const metric: DashboardMetric = {
    id: 'total-sales',
    title: 'Ventas totales',
    value: 8350895,
    formattedValue: '$ 8.350.895',
    subtitle: 'Recaudo registrado',
    icon: 'payments',
    trendValue: null,
    trendDirection: 'neutral',
    status: 'default',
    format: 'currency',
    tooltip: null,
    footer: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCardComponent);
    fixture.componentRef.setInput('metric', metric);
  });

  it('should render formatted currency value', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('$ 8.350.895');
  });

  it('should show loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-metric-card-skeleton')).toBeTruthy();
  });

  it('should show unavailable state', () => {
    fixture.componentRef.setInput('metric', {
      ...metric,
      status: 'unavailable',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Indicador no disponible.');
  });
});
