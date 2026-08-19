import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  DELIVERY_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../../utils/office.constants';
import {
  DeliveryStatus,
  OrderFilters,
  OrderStatus,
  PaymentStatus,
} from '../../data-access/office.models';

@Component({
  selector: 'app-office-filters',
  templateUrl: './office-filters.html',
  styleUrl: './office-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeFiltersComponent {
  readonly search = input('');
  readonly filters = input.required<OrderFilters>();

  readonly searchChange = output<string>();
  readonly filtersChange = output<OrderFilters>();
  readonly clear = output<void>();

  protected readonly orderStatuses = ORDER_STATUS_OPTIONS;
  protected readonly paymentStatuses = PAYMENT_STATUS_OPTIONS;
  protected readonly deliveryStatuses = DELIVERY_STATUS_OPTIONS;

  setOrderStatus(value: string): void {
    this.filtersChange.emit({ ...this.filters(), orderStatus: value as OrderStatus | 'all' });
  }

  setPaymentStatus(value: string): void {
    this.filtersChange.emit({ ...this.filters(), paymentStatus: value as PaymentStatus | 'all' });
  }

  setDeliveryStatus(value: string): void {
    this.filtersChange.emit({ ...this.filters(), deliveryStatus: value as DeliveryStatus | 'all' });
  }

  setUrgent(value: string): void {
    this.filtersChange.emit({ ...this.filters(), urgent: value as OrderFilters['urgent'] });
  }

  setPendingConfirmation(checked: boolean): void {
    this.filtersChange.emit({ ...this.filters(), pendingConfirmation: checked });
  }
}
