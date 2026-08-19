import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TrackingSearchResult } from '../../data-access/tracking.models';
import { formatCurrency, formatDate } from '../../utils/tracking.formatters';
import {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../utils/tracking-status.utils';

@Component({
  selector: 'app-tracking-info-cards',
  templateUrl: './tracking-info-cards.html',
  styleUrl: './tracking-info-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingInfoCardsComponent {
  readonly result = input.required<TrackingSearchResult>();

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly deliveryStatusLabel = deliveryStatusLabel;
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly paymentStatusLabel = paymentStatusLabel;
}
