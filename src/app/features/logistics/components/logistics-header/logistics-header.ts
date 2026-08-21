import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-logistics-header',
  imports: [DatePipe],
  templateUrl: './logistics-header.html',
  styleUrl: './logistics-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsHeaderComponent {
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);
  readonly incidentCount = input(0);
  readonly filtersOpen = input(false);
  readonly activeFilterCount = input(0);

  readonly refresh = output<void>();
  readonly openPending = output<void>();
  readonly openIncidents = output<void>();
  readonly toggleFilters = output<void>();
}
