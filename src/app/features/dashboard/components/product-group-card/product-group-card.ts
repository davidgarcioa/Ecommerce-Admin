import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ProductGroup } from '../../models/product-group.model';
import { formatDashboardDate } from '../../utils/dashboard-formatters';

export type ProductGroupAction = 'open' | 'edit' | 'duplicate' | 'delete';

@Component({
  selector: 'app-product-group-card',
  templateUrl: './product-group-card.html',
  styleUrl: './product-group-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupCardComponent {
  readonly productGroup = input.required<ProductGroup>();
  readonly active = input(false);

  readonly selectProductGroup = output<string>();
  readonly productGroupAction = output<{
    readonly action: ProductGroupAction;
    readonly productGroupId: string;
  }>();

  readonly formatDate = formatDashboardDate;

  onSelectProductGroup(): void {
    this.selectProductGroup.emit(this.productGroup().id);
  }

  onProductGroupAction(action: ProductGroupAction, event: MouseEvent): void {
    event.stopPropagation();
    this.productGroupAction.emit({ action, productGroupId: this.productGroup().id });
  }
}
