import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ProductGroup, ProductGroupProfitability } from '../../data-access/product-groups.models';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '../../utils/product-group-formatters';

@Component({
  selector: 'app-product-group-metrics',
  templateUrl: './product-group-metrics.html',
  styleUrl: './product-group-metrics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupMetricsComponent {
  readonly group = input.required<ProductGroup>();
  readonly profitability = input<ProductGroupProfitability | null>(null);

  protected readonly formatCurrency = formatCurrency;
  protected readonly formatNumber = formatNumber;
  protected readonly formatPercentage = formatPercentage;
}
