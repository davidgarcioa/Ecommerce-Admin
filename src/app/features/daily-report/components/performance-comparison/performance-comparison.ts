import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AnimateOnViewDirective } from '../../../../shared/directives/animate-on-view.directive';
import { ReportComparison } from '../../models/report-comparison.model';

@Component({
  selector: 'app-performance-comparison',
  imports: [AnimateOnViewDirective],
  templateUrl: './performance-comparison.html',
  styleUrl: './performance-comparison.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceComparisonComponent {
  readonly comparison = input.required<readonly ReportComparison[]>();

  readonly positiveCount = computed(
    () => this.comparison().filter((item) => item.tone === 'positive').length,
  );
  readonly negativeCount = computed(
    () => this.comparison().filter((item) => item.tone === 'negative').length,
  );

  formatPercent(value: number): string {
    const formatted = new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 1,
      signDisplay: 'exceptZero',
    }).format(value);

    return `${formatted} %`;
  }

  getDirectionIcon(item: ReportComparison): string {
    if (item.direction === 'up') {
      return 'trending_up';
    }

    if (item.direction === 'down') {
      return 'trending_down';
    }

    return 'trending_flat';
  }

  getToneLabel(item: ReportComparison): string {
    if (item.tone === 'positive') {
      return 'Favorable';
    }

    if (item.tone === 'negative') {
      return 'Revisar';
    }

    return 'Estable';
  }

  getCurrentWidth(item: ReportComparison): number {
    return this.getWidth(item.currentValue, item.previousValue);
  }

  getPreviousWidth(item: ReportComparison): number {
    return this.getWidth(item.previousValue, item.currentValue);
  }

  private getWidth(value: number, comparedValue: number): number {
    const base = Math.max(Math.abs(value), Math.abs(comparedValue), 1);
    return Math.max((Math.abs(value) / base) * 100, 6);
  }
}
