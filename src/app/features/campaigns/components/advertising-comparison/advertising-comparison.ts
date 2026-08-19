import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CampaignComparison } from '../../models/campaign-comparison.model';

@Component({
  selector: 'app-advertising-comparison',
  templateUrl: './advertising-comparison.html',
  styleUrl: './advertising-comparison.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisingComparisonComponent {
  readonly comparison = input.required<readonly CampaignComparison[]>();

  formatPercent(value: number): string {
    return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value)} %`;
  }
}
