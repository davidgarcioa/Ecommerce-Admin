import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CampaignMetric } from '../../models/campaign-metric.model';

interface CampaignVisualMetric extends CampaignMetric {
  readonly intensity: number;
}

@Component({
  selector: 'app-advertising-summary-grid',
  templateUrl: './advertising-summary-grid.html',
  styleUrl: './advertising-summary-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisingSummaryGridComponent {
  readonly metrics = input.required<readonly CampaignMetric[]>();
  readonly loading = input(false);
  readonly cards = computed<readonly CampaignVisualMetric[]>(() => {
    const maxValue = Math.max(...this.metrics().map((metric) => metric.value), 1);

    return this.metrics().map((metric) => ({
      ...metric,
      intensity: Math.max(8, Math.min(100, (metric.value / maxValue) * 100)),
    }));
  });
}
