import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LogisticsHistoryItem, LogisticsOrder } from '../../data-access/logistics.models';
import { formatCurrency, formatDate, maskPhone } from '../../utils/logistics.formatters';
import {
  deliveryStatusLabel,
  dispatchStateLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../utils/logistics-status.utils';

@Component({
  selector: 'app-dispatch-detail-panel',
  templateUrl: './dispatch-detail-panel.html',
  styleUrl: './dispatch-detail-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchDetailPanelComponent {
  readonly order = input.required<LogisticsOrder>();
  readonly history = input<readonly LogisticsHistoryItem[]>([]);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatDate = formatDate;
  protected readonly maskPhone = maskPhone;
  protected readonly deliveryStatusLabel = deliveryStatusLabel;
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly paymentStatusLabel = paymentStatusLabel;
  protected readonly dispatchStateLabel = dispatchStateLabel;
}
