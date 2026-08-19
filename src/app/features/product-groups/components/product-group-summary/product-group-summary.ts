import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '../../utils/product-group-formatters';

@Component({
  selector: 'app-product-group-summary',
  templateUrl: './product-group-summary.html',
  styleUrl: './product-group-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupSummaryComponent {
  readonly total = input(0);
  readonly active = input(0);
  readonly archived = input(0);
  readonly products = input(0);
  readonly revenue = input(0);
  readonly profit = input(0);
  readonly margin = input(0);
  readonly loading = input(false);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatNumber = formatNumber;
  protected readonly formatPercentage = formatPercentage;
}
