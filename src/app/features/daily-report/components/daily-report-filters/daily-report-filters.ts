import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import {
  CARRIERS,
  CITIES,
  ORDER_STATUSES,
  PRODUCT_GROUP_OPTIONS,
} from '../../constants/daily-report.constants';
import { Carrier, OrderStatus } from '../../models/daily-order.model';
import { DailyReportFilter, DailyReportPeriod } from '../../models/daily-report-filter.model';

@Component({
  selector: 'app-daily-report-filters',
  templateUrl: './daily-report-filters.html',
  styleUrl: './daily-report-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReportFiltersComponent {
  readonly filters = input.required<DailyReportFilter>();
  readonly applyFilters = output<DailyReportFilter>();
  readonly clearFilters = output<void>();
  readonly productGroups = PRODUCT_GROUP_OPTIONS;
  readonly statuses = ORDER_STATUSES;
  readonly carriers = CARRIERS;
  readonly cities = CITIES;
  readonly localFilters = signal<DailyReportFilter | null>(null);

  current(): DailyReportFilter {
    return this.localFilters() ?? this.filters();
  }

  update<K extends keyof DailyReportFilter>(key: K, value: DailyReportFilter[K]): void {
    this.localFilters.set({ ...this.current(), [key]: value });
  }

  onDateChange(event: Event): void {
    this.update('date', (event.target as HTMLInputElement).value);
  }

  onPeriodChange(event: Event): void {
    this.update('period', (event.target as HTMLSelectElement).value as DailyReportPeriod);
  }

  onProductGroupChange(event: Event): void {
    this.update('productGroupId', (event.target as HTMLSelectElement).value);
  }

  onStatusChange(event: Event): void {
    this.update('orderStatus', (event.target as HTMLSelectElement).value as OrderStatus | 'Todos');
  }

  onCarrierChange(event: Event): void {
    this.update('carrier', (event.target as HTMLSelectElement).value as Carrier | 'Todas');
  }

  onCityChange(event: Event): void {
    this.update('city', (event.target as HTMLSelectElement).value);
  }

  onApply(): void {
    this.applyFilters.emit(this.current());
  }

  onClear(): void {
    this.localFilters.set(null);
    this.clearFilters.emit();
  }
}
