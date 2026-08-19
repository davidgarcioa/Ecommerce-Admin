import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TRACKING_SEARCH_TYPES } from '../../utils/tracking.constants';
import { TrackingRecentSearch, TrackingSearchType } from '../../data-access/tracking.models';

@Component({
  selector: 'app-tracking-search',
  templateUrl: './tracking-search.html',
  styleUrl: './tracking-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingSearchComponent {
  readonly type = input.required<TrackingSearchType>();
  readonly value = input('');
  readonly loading = input(false);
  readonly recentSearches = input<readonly TrackingRecentSearch[]>([]);

  readonly typeChange = output<TrackingSearchType>();
  readonly valueChange = output<string>();
  readonly search = output<void>();
  readonly clear = output<void>();
  readonly recentSelected = output<TrackingRecentSearch>();

  protected readonly types = TRACKING_SEARCH_TYPES;
  protected readonly currentType = computed(
    () => this.types.find((type) => type.id === this.type()) ?? this.types[0],
  );

  setType(value: string): void {
    this.typeChange.emit(value as TrackingSearchType);
  }
}
