import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { formatCompactCurrency, formatNumber } from '../../utils/office.formatters';

@Component({
  selector: 'app-office-summary',
  templateUrl: './office-summary.html',
  styleUrl: './office-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficeSummaryComponent {
  readonly total = input(0);
  readonly pending = input(0);
  readonly confirmed = input(0);
  readonly pendingPayment = input(0);
  readonly novelties = input(0);
  readonly cancelled = input(0);
  readonly today = input(0);
  readonly pendingValue = input(0);

  protected readonly formatNumber = formatNumber;
  protected readonly formatCompactCurrency = formatCompactCurrency;
}
