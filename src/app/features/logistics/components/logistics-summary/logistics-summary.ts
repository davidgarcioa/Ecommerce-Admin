import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { formatNumber } from '../../utils/logistics.formatters';

@Component({
  selector: 'app-logistics-summary',
  templateUrl: './logistics-summary.html',
  styleUrl: './logistics-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsSummaryComponent {
  readonly pending = input(0);
  readonly ready = input(0);
  readonly inTransit = input(0);
  readonly deliveredToday = input(0);
  readonly failed = input(0);
  readonly incidents = input(0);
  readonly inReturn = input(0);
  readonly returned = input(0);

  protected readonly formatNumber = formatNumber;
}
