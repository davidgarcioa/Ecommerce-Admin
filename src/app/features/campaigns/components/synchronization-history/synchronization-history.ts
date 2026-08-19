import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SynchronizationRecord } from '../../models/synchronization-record.model';
import { formatDateTime } from '../../utils/campaigns.utils';

@Component({
  selector: 'app-synchronization-history',
  templateUrl: './synchronization-history.html',
  styleUrl: './synchronization-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynchronizationHistoryComponent {
  readonly records = input.required<readonly SynchronizationRecord[]>();
  readonly formatDate = formatDateTime;
}
