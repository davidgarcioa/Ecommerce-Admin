import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AnimateOnViewDirective } from '../../../../shared/directives/animate-on-view.directive';
import { DailyMetric } from '../../models/daily-metric.model';

interface VisualDailyMetric extends DailyMetric {
  readonly visualWeight: number;
  readonly visualLabel: string;
}

@Component({
  selector: 'app-daily-summary-grid',
  imports: [AnimateOnViewDirective],
  templateUrl: './daily-summary-grid.html',
  styleUrl: './daily-summary-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailySummaryGridComponent {
  readonly metrics = input.required<readonly DailyMetric[]>();
  readonly loading = input(false);

  readonly visualMetrics = computed<readonly VisualDailyMetric[]>(() =>
    this.metrics().map((metric) => ({
      ...metric,
      ...this.getVisualProgress(metric),
    })),
  );

  private getVisualProgress(
    metric: DailyMetric,
  ): Pick<VisualDailyMetric, 'visualWeight' | 'visualLabel'> {
    const orders = this.findMetricValue('orders');
    const confirmed = this.findMetricValue('confirmed');
    const sales = this.findMetricValue('sales');
    const profit = this.findMetricValue('profit');
    const adSpend = this.findMetricValue('ad-spend');

    switch (metric.id) {
      case 'orders':
      case 'sales':
        return progress(100, 'Base del periodo');
      case 'confirmed':
        return progress(ratio(metric.value, orders), `${metric.value} de ${orders} órdenes`);
      case 'deliveries':
        return progress(
          ratio(metric.value, confirmed),
          `${metric.value} de ${confirmed} confirmadas`,
        );
      case 'delivery-rate':
        return progress(metric.value, 'Tasa real de entrega');
      case 'profit':
        return progress(ratio(profit, sales), 'Margen sobre ventas');
      case 'ad-spend':
        return progress(ratio(adSpend, sales), 'Inversión sobre ventas');
      case 'roas':
        return progress(ratio(metric.value, 4), 'Meta visual 4,0x');
      case 'cpa':
        return progress(ratio(30000, metric.value), 'Eficiencia frente a CPA objetivo');
      case 'returns':
      case 'cancelled':
      case 'urgent':
        return progress(ratio(metric.value, orders), `${metric.value} de ${orders} órdenes`);
      default:
        return progress(0, 'Sin referencia visual');
    }
  }

  private findMetricValue(id: string): number {
    return this.metrics().find((metric) => metric.id === id)?.value ?? 0;
  }
}

function ratio(value: number, base: number): number {
  if (base <= 0) {
    return 0;
  }

  return (value / base) * 100;
}

function progress(
  value: number,
  visualLabel: string,
): Pick<VisualDailyMetric, 'visualWeight' | 'visualLabel'> {
  return {
    visualWeight: clamp(value),
    visualLabel,
  };
}

function clamp(value: number): number {
  if (value <= 0) {
    return 0;
  }

  return Math.min(Math.max(value, 4), 100);
}
