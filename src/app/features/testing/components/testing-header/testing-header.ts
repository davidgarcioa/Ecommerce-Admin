import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { formatTestingDate } from '../../utils/testing.formatters';

@Component({
  selector: 'app-testing-header',
  templateUrl: './testing-header.html',
  styleUrl: './testing-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingHeaderComponent {
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);
  readonly canCreate = input(false);
  readonly filtersVisible = input(false);
  readonly activeFiltersCount = input(0);
  readonly create = output<void>();
  readonly refresh = output<void>();
  readonly toggleFilters = output<void>();

  protected formatLastUpdated(value: string | null): string {
    return value ? formatTestingDate(value) : 'Sin sincronizar';
  }
}
