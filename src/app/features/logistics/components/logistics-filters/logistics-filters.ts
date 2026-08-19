import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  LogisticsDeliveryStatus,
  LogisticsFilters,
  LogisticsOrderStatus,
  LogisticsPaymentStatus,
} from '../../data-access/logistics.models';

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
] as const;
const DELIVERY_STATUSES = [
  'Pending',
  'Assigned',
  'In Transit',
  'Delivered',
  'Returned',
  'Failed',
] as const;
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded', 'Failed', 'Partial'] as const;

@Component({
  selector: 'app-logistics-filters',
  templateUrl: './logistics-filters.html',
  styleUrl: './logistics-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsFiltersComponent {
  readonly search = input('');
  readonly filters = input.required<LogisticsFilters>();

  readonly searchChange = output<string>();
  readonly filtersChange = output<LogisticsFilters>();
  readonly clear = output<void>();

  protected readonly orderStatuses = ORDER_STATUSES;
  protected readonly deliveryStatuses = DELIVERY_STATUSES;
  protected readonly paymentStatuses = PAYMENT_STATUSES;

  setOrderStatus(value: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      orderStatus: value as LogisticsOrderStatus | 'all',
    });
  }

  setDeliveryStatus(value: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      deliveryStatus: value as LogisticsDeliveryStatus | 'all',
    });
  }

  setPaymentStatus(value: string): void {
    this.filtersChange.emit({
      ...this.filters(),
      paymentStatus: value as LogisticsPaymentStatus | 'all',
    });
  }

  setCarrier(value: string): void {
    this.filtersChange.emit({ ...this.filters(), carrier: value });
  }

  setCity(value: string): void {
    this.filtersChange.emit({ ...this.filters(), city: value });
  }

  setWithoutTracking(checked: boolean): void {
    this.filtersChange.emit({ ...this.filters(), withoutTracking: checked });
  }

  setWithIncident(checked: boolean): void {
    this.filtersChange.emit({ ...this.filters(), withIncident: checked });
  }

  setWithReturn(checked: boolean): void {
    this.filtersChange.emit({ ...this.filters(), withReturn: checked });
  }
}
