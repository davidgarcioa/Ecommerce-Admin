import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Order, OrderHistoryItem, OrderObservation } from '../../data-access/office.models';
import { formatCurrency, formatDate, maskPhone } from '../../utils/office.formatters';
import {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../utils/order-status.utils';

@Component({
  selector: 'app-order-info-cards',
  templateUrl: './order-info-cards.html',
  styleUrl: './order-info-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderInfoCardsComponent {
  readonly order = input.required<Order>();
  readonly history = input<readonly OrderHistoryItem[]>([]);
  readonly observations = input<readonly OrderObservation[]>([]);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly maskPhone = maskPhone;
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly paymentStatusLabel = paymentStatusLabel;
  protected readonly deliveryStatusLabel = deliveryStatusLabel;
}
