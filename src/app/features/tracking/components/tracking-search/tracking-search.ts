import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TrackingRecentSearch } from '../../data-access/tracking.models';

@Component({
  selector: 'app-tracking-search',
  templateUrl: './tracking-search.html',
  styleUrl: './tracking-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingSearchComponent {
  readonly value = input('');
  readonly loading = input(false);
  readonly recentSearches = input<readonly TrackingRecentSearch[]>([]);

  readonly valueChange = output<string>();
  readonly search = output<void>();
  readonly clear = output<void>();
  readonly recentSelected = output<TrackingRecentSearch>();
}
