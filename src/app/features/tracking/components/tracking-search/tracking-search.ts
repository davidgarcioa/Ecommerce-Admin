import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { TrackingRecentSearch, TrackingSearchType } from '../../data-access/tracking.models';
import { TRACKING_SEARCH_TYPES } from '../../utils/tracking.constants';

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
  protected readonly typeMenuOpen = signal(false);
  protected readonly currentType = computed(
    () => this.types.find((type) => type.id === this.type()) ?? this.types[0],
  );

  toggleTypeMenu(): void {
    this.typeMenuOpen.update((open) => !open);
  }

  closeTypeMenuOnBlur(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    const currentTarget = event.currentTarget as Node | null;
    if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) return;
    this.typeMenuOpen.set(false);
  }

  setType(value: TrackingSearchType): void {
    this.typeChange.emit(value);
    this.typeMenuOpen.set(false);
  }
}
