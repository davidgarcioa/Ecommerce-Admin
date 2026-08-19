import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DashboardMetric } from '../../models/dashboard-metric.model';
import { MetricCardSkeletonComponent } from '../skeleton-metric-card/skeleton-metric-card';

@Component({
  selector: 'app-metric-card',
  imports: [MetricCardSkeletonComponent],
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  readonly metric = input.required<DashboardMetric>();
  readonly compact = input(false);
  readonly loading = input(false);
  readonly interactive = input(false);

  readonly isUnavailable = computed(() => this.metric().status === 'unavailable');
  readonly showTrend = computed(() => this.metric().trendValue !== null);
}
