import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Campaign } from '../../models/campaign.model';
import { formatCampaignValue, formatDateTime } from '../../utils/campaigns.utils';

@Component({
  selector: 'app-campaign-detail-drawer',
  templateUrl: './campaign-detail-drawer.html',
  styleUrl: './campaign-detail-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignDetailDrawerComponent {
  readonly campaign = input.required<Campaign>();
  readonly close = output<void>();
  readonly edit = output<Campaign>();
  readonly duplicate = output<Campaign>();
  readonly archive = output<string>();
  readonly toggleStatus = output<Campaign>();
  readonly formatValue = formatCampaignValue;
  readonly formatDate = formatDateTime;

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
