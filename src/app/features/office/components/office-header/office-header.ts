import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-office-header',
  imports: [DatePipe],
  templateUrl: './office-header.html',
  styleUrl: './office-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeHeaderComponent {
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);
  readonly filtersOpen = input(false);
  readonly activeFilterCount = input(0);

  readonly refresh = output<void>();
  readonly openPending = output<void>();
  readonly toggleFilters = output<void>();
}
