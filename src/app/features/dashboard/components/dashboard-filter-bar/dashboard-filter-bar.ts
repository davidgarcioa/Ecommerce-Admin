import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DASHBOARD_PERIOD_OPTIONS } from '../../constants/dashboard.constants';
import { DashboardFilter, DashboardPeriod } from '../../models/dashboard-filter.model';
import { ProductGroup } from '../../models/product-group.model';

@Component({
  selector: 'app-dashboard-filter-bar',
  templateUrl: './dashboard-filter-bar.html',
  styleUrl: './dashboard-filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFilterBarComponent {
  readonly filters = input.required<DashboardFilter>();
  readonly productGroups = input.required<readonly ProductGroup[]>();
  readonly filterMessage = input.required<string>();

  readonly updateFilters = output<DashboardFilter>();
  readonly clearFilters = output<void>();

  readonly periodOptions = DASHBOARD_PERIOD_OPTIONS;

  onProductGroupChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.updateFilters.emit({
      ...this.filters(),
      productGroupId: select.value,
    });
  }

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.updateFilters.emit({
      ...this.filters(),
      period: select.value as DashboardPeriod,
    });
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}
