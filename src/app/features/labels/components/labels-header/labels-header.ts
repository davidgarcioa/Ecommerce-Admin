import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { formatTagDate } from '../../utils/tags.formatters';

@Component({
  selector: 'app-labels-header',
  templateUrl: './labels-header.html',
  styleUrl: './labels-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsHeaderComponent {
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);
  readonly canCreate = input(false);
  readonly filtersVisible = input(false);
  readonly activeFiltersCount = input(0);
  readonly create = output<void>();
  readonly refresh = output<void>();
  readonly toggleFilters = output<void>();

  protected formatLastUpdated(value: string | null): string {
    return value ? formatTagDate(value) : 'Sin sincronizar';
  }
}
