import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TrackingSearchResult } from '../../data-access/tracking.models';
import { formatDate } from '../../utils/tracking.formatters';
import { deliveryStatusLabel, orderStatusLabel } from '../../utils/tracking-status.utils';

@Component({
  selector: 'app-tracking-result-summary',
  templateUrl: './tracking-result-summary.html',
  styleUrl: './tracking-result-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingResultSummaryComponent {
  readonly result = input.required<TrackingSearchResult>();
  readonly canViewOrder = input(false);
  readonly canViewLogistics = input(false);

  readonly copyTracking = output<string>();
  readonly copyOrder = output<string>();
  readonly openOffice = output<string>();
  readonly openLogistics = output<string>();

  protected readonly formatDate = formatDate;
  protected readonly deliveryStatusLabel = deliveryStatusLabel;
  protected readonly orderStatusLabel = orderStatusLabel;
}
