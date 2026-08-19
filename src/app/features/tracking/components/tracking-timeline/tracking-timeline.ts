import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { sourceLabel } from '../../data-access/tracking.mapper';
import { TrackingEvent } from '../../data-access/tracking.models';
import { formatDate } from '../../utils/tracking.formatters';

@Component({
  selector: 'app-tracking-timeline',
  templateUrl: './tracking-timeline.html',
  styleUrl: './tracking-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingTimelineComponent {
  readonly events = input<readonly TrackingEvent[]>([]);

  protected readonly formatDate = formatDate;
  protected readonly sourceLabel = sourceLabel;
}
