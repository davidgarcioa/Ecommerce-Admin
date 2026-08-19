import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AnimateOnViewDirective } from '../../../../shared/directives/animate-on-view.directive';

import { OperationalStatusItem } from '../../models/daily-report.model';
import { formatDailyValue } from '../../utils/daily-report.utils';

type OperationalStatusTone = 'info' | 'positive' | 'warning' | 'danger' | 'neutral';

interface OperationalStatusMeta {
  readonly icon: string;
  readonly tone: OperationalStatusTone;
  readonly accent: string;
  readonly shortLabel: string;
}

interface OperationalStatusView extends OperationalStatusItem {
  readonly accent: string;
  readonly icon: string;
  readonly percentageLabel: string;
  readonly shortLabel: string;
  readonly tone: OperationalStatusTone;
}

@Component({
  selector: 'app-operational-status-summary',
  imports: [AnimateOnViewDirective],
  templateUrl: './operational-status-summary.html',
  styleUrl: './operational-status-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationalStatusSummaryComponent {
  readonly items = input.required<readonly OperationalStatusItem[]>();
  readonly totalCount = computed(() => this.items().reduce((total, item) => total + item.count, 0));
  readonly statusItems = computed<readonly OperationalStatusView[]>(() =>
    this.items().map((item) => {
      const meta = this.getStatusMeta(item.status);

      return {
        ...item,
        ...meta,
        percentageLabel: this.formatPercentage(item.percentage),
      };
    }),
  );
  readonly primaryStatus = computed(() =>
    this.statusItems().reduce<OperationalStatusView | null>(
      (leader, item) => (leader === null || item.count > leader.count ? item : leader),
      null,
    ),
  );

  readonly formatPercentage = (value: number): string => formatDailyValue(value, 'percentage');

  private getStatusMeta(status: OperationalStatusItem['status']): OperationalStatusMeta {
    switch (status) {
      case 'Pendiente':
        return {
          accent: '#F59E0B',
          icon: 'schedule',
          shortLabel: 'Pendiente',
          tone: 'warning',
        };
      case 'Confirmada':
        return {
          accent: '#3B82F6',
          icon: 'task_alt',
          shortLabel: 'Confirmada',
          tone: 'info',
        };
      case 'En preparación':
        return {
          accent: '#A855F7',
          icon: 'inventory_2',
          shortLabel: 'Preparación',
          tone: 'neutral',
        };
      case 'Despachada':
        return {
          accent: '#38BDF8',
          icon: 'local_shipping',
          shortLabel: 'Despachada',
          tone: 'info',
        };
      case 'En tránsito':
        return {
          accent: '#06B6D4',
          icon: 'route',
          shortLabel: 'En tránsito',
          tone: 'info',
        };
      case 'Entregada':
        return {
          accent: '#10B981',
          icon: 'verified',
          shortLabel: 'Entregada',
          tone: 'positive',
        };
      case 'Devuelta':
        return {
          accent: '#EF4444',
          icon: 'assignment_return',
          shortLabel: 'Devuelta',
          tone: 'danger',
        };
      case 'Cancelada':
        return {
          accent: '#94A3B8',
          icon: 'block',
          shortLabel: 'Cancelada',
          tone: 'neutral',
        };
      default:
        return {
          accent: '#94A3B8',
          icon: 'radio_button_checked',
          shortLabel: status,
          tone: 'neutral',
        };
    }
  }
}
