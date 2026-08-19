import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AnimateOnViewDirective } from '../../../../shared/directives/animate-on-view.directive';
import { ProductGroupPerformance } from '../../models/product-group-performance.model';
import { formatDailyValue } from '../../utils/daily-report.utils';

interface ProductGroupInsight extends ProductGroupPerformance {
  readonly salesLabel: string;
  readonly profitLabel: string;
  readonly cpaLabel: string;
  readonly roasLabel: string;
  readonly deliveryRateLabel: string;
  readonly salesShare: number;
  readonly profitShare: number;
  readonly deliveryScore: number;
  readonly efficiencyTone: 'strong' | 'stable' | 'attention';
  readonly insight: string;
}

@Component({
  selector: 'app-product-group-performance',
  imports: [AnimateOnViewDirective],
  templateUrl: './product-group-performance.html',
  styleUrl: './product-group-performance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupPerformanceComponent {
  readonly data = input.required<readonly ProductGroupPerformance[]>();

  readonly insights = computed<readonly ProductGroupInsight[]>(() => {
    const groups = this.data();
    const totalSales = groups.reduce((total, group) => total + group.sales, 0);
    const maxProfit = Math.max(...groups.map((group) => group.estimatedProfit), 1);

    return [...groups]
      .sort((first, second) => second.sales - first.sales)
      .map((group) => ({
        ...group,
        salesLabel: formatDailyValue(group.sales, 'currency'),
        profitLabel: formatDailyValue(group.estimatedProfit, 'currency'),
        cpaLabel: formatDailyValue(group.cpa, 'currency'),
        roasLabel: formatDailyValue(group.roas, 'multiplier'),
        deliveryRateLabel: `${Math.round(group.deliveryRate)}%`,
        salesShare: getPercent(group.sales, totalSales),
        profitShare: getPercent(group.estimatedProfit, maxProfit),
        deliveryScore: clamp(group.deliveryRate),
        efficiencyTone: getEfficiencyTone(group),
        insight: getInsight(group),
      }));
  });

  readonly leader = computed(() => this.insights()[0] ?? null);
}

function getEfficiencyTone(group: ProductGroupPerformance): ProductGroupInsight['efficiencyTone'] {
  if (group.roas >= 3.6 && group.deliveryRate >= 55 && group.cpa <= 30000) {
    return 'strong';
  }

  if (group.deliveryRate < 45 || group.roas < 2.8 || group.cpa > 35000) {
    return 'attention';
  }

  return 'stable';
}

function getInsight(group: ProductGroupPerformance): string {
  if (group.roas >= 3.6 && group.deliveryRate >= 55) {
    return 'Escala saludable';
  }

  if (group.cpa > 35000) {
    return 'CPA alto';
  }

  if (group.deliveryRate < 45) {
    return 'Entrega débil';
  }

  return 'Mantener control';
}

function getPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return clamp((value / total) * 100);
}

function clamp(value: number): number {
  if (value <= 0) {
    return 0;
  }

  return Math.min(Math.max(value, 4), 100);
}
