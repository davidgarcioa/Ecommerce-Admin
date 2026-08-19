import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DashboardMetric } from '../../models/dashboard-metric.model';
import { MetricCardComponent } from '../metric-card/metric-card';

@Component({
  selector: 'app-metrics-grid',
  imports: [MetricCardComponent],
  templateUrl: './metrics-grid.html',
  styleUrl: './metrics-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsGridComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly metrics = input.required<readonly DashboardMetric[]>();
  readonly loading = input(false);
  readonly compact = input(false);
}
