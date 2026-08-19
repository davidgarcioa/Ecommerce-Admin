import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TrackingSearchResult } from '../../data-access/tracking.models';
import { formatDate } from '../../utils/tracking.formatters';
import { deliveryStatusLabel } from '../../utils/tracking-status.utils';

@Component({
  selector: 'app-tracking-multiple-results',
  templateUrl: './tracking-multiple-results.html',
  styleUrl: './tracking-multiple-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingMultipleResultsComponent {
  readonly results = input<readonly TrackingSearchResult[]>([]);
  readonly selectResult = output<TrackingSearchResult>();

  protected readonly formatDate = formatDate;
  protected readonly deliveryStatusLabel = deliveryStatusLabel;
}
