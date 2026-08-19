import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMetric } from '../../models/dashboard-metric.model';
import { MetricsGridComponent } from './metrics-grid';

describe('MetricsGridComponent', () => {
  let fixture: ComponentFixture<MetricsGridComponent>;

  const metrics: readonly DashboardMetric[] = [
    {
      id: 'orders',
      title: 'Órdenes',
      value: 139,
      formattedValue: '139',
      subtitle: 'Órdenes únicas',
      icon: 'receipt_long',
      trendValue: null,
      trendDirection: 'neutral',
      status: 'default',
      format: 'number',
      tooltip: null,
      footer: null,
    },
    {
      id: 'sales',
      title: 'Ventas',
      value: 1000,
      formattedValue: '$ 1.000',
      subtitle: 'Recaudo',
      icon: 'payments',
      trendValue: null,
      trendDirection: 'neutral',
      status: 'default',
      format: 'currency',
      tooltip: null,
      footer: null,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricsGridComponent);
    fixture.componentRef.setInput('title', 'Resumen principal');
    fixture.componentRef.setInput('metrics', metrics);
  });

  it('should render the correct number of metrics', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('app-metric-card').length).toBe(2);
  });
});
