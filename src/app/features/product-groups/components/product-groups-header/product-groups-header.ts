import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-product-groups-header',
  imports: [DatePipe],
  templateUrl: './product-groups-header.html',
  styleUrl: './product-groups-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupsHeaderComponent {
  readonly canCreate = input(false);
  readonly loading = input(false);
  readonly lastUpdated = input<string | null>(null);
  readonly filtersVisible = input(false);
  readonly activeFiltersCount = input(0);

  readonly create = output<void>();
  readonly refresh = output<void>();
  readonly toggleFilters = output<void>();
}
