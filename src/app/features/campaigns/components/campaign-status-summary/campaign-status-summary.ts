import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CampaignStatusSummaryItem } from '../../models/campaigns-state.model';
import { formatCampaignValue } from '../../utils/campaigns.utils';

@Component({
  selector: 'app-campaign-status-summary',
  templateUrl: './campaign-status-summary.html',
  styleUrl: './campaign-status-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignStatusSummaryComponent {
  readonly items = input.required<readonly CampaignStatusSummaryItem[]>();
  readonly formatValue = formatCampaignValue;
}
