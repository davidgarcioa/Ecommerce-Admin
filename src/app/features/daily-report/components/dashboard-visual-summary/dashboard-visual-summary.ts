import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DailyMetric } from '../../models/daily-metric.model';
import { DailyOrder } from '../../models/daily-order.model';
import { ProductGroupPerformance } from '../../models/product-group-performance.model';
import { formatDailyValue } from '../../utils/daily-report.utils';
import { GuideStatusDonutComponent } from './components/guide-status-donut/guide-status-donut';
import { VisualDonutCardComponent } from './components/visual-donut-card/visual-donut-card';
import { VisualMetric } from './dashboard-visual-summary.models';
import { clampPercentage, formatCompactCurrency } from './dashboard-visual-summary.utils';

@Component({
  selector: 'app-dashboard-visual-summary',
  imports: [GuideStatusDonutComponent, VisualDonutCardComponent],
  templateUrl: './dashboard-visual-summary.html',
  styleUrl: './dashboard-visual-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardVisualSummaryComponent {
  readonly metrics = input.required<readonly DailyMetric[]>();
  readonly productGroups = input.required<readonly ProductGroupPerformance[]>();
  readonly orders = input<readonly DailyOrder[]>([]);

  readonly confirmedVisual = computed<VisualMetric>(() => {
    const orders = this.findMetricValue('orders');
    const confirmed = this.findMetricValue('confirmed');

    return {
      label: 'Ordenes confirmadas',
      compactValue: formatDailyValue(confirmed, 'number'),
      helper: `${formatDailyValue(confirmed, 'number')} de ${formatDailyValue(orders, 'number')} ordenes`,
      percentage: orders === 0 ? 0 : clampPercentage((confirmed / orders) * 100),
      tone: 'green',
    };
  });

  readonly deliveriesVisual = computed<VisualMetric>(() => {
    const confirmed = this.findMetricValue('confirmed');
    const deliveries = this.findMetricValue('deliveries');

    return {
      label: 'Entregas',
      compactValue: formatDailyValue(deliveries, 'number'),
      helper: `${formatDailyValue(deliveries, 'number')} de ${formatDailyValue(confirmed, 'number')} confirmadas`,
      percentage: confirmed === 0 ? 0 : clampPercentage((deliveries / confirmed) * 100),
      tone: 'teal',
    };
  });

  readonly deliveryVisual = computed<VisualMetric>(() => {
    const rate = this.findMetricValue('delivery-rate');
    const deliveries = this.findMetricValue('deliveries');
    const confirmed = this.findMetricValue('confirmed');

    return {
      label: 'Entrega',
      compactValue: formatDailyValue(rate, 'percentage'),
      helper: `${formatDailyValue(deliveries, 'number')} de ${formatDailyValue(confirmed, 'number')} confirmadas`,
      percentage: clampPercentage(rate),
      tone: 'blue',
    };
  });

  readonly profitVisual = computed<VisualMetric>(() => {
    const profit = this.findMetricValue('profit');
    const sales = this.findMetricValue('sales');
    const percentage = sales === 0 ? 0 : (profit / sales) * 100;

    return {
      label: 'Margen estimado',
      compactValue: formatCompactCurrency(profit),
      helper: `${formatDailyValue(percentage, 'percentage')} sobre ventas`,
      percentage: clampPercentage(percentage),
      tone: 'amber',
    };
  });

  private findMetricValue(id: string): number {
    return this.metrics().find((metric) => metric.id === id)?.value ?? 0;
  }
}
