import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ORDER_STATUSES } from '../../constants/daily-report.constants';
import { DailyOrder, OrderStatus } from '../../models/daily-order.model';
import { formatDailyValue, formatReportDate, maskPhone } from '../../utils/daily-report.utils';

@Component({
  selector: 'app-daily-order-detail',
  templateUrl: './daily-order-detail.html',
  styleUrl: './daily-order-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyOrderDetailComponent {
  readonly order = input.required<DailyOrder>();
  readonly close = output<void>();
  readonly updateStatus = output<OrderStatus>();
  readonly toggleUrgent = output<void>();
  readonly statuses = ORDER_STATUSES;
  readonly formatDate = formatReportDate;
  readonly maskPhone = maskPhone;
  readonly formatCurrency = (value: number): string => formatDailyValue(value, 'currency');

  onStatusChange(event: Event): void {
    this.updateStatus.emit((event.target as HTMLSelectElement).value as OrderStatus);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
