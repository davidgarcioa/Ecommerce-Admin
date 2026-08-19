import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ProductGroupStatus } from '../../data-access/product-groups.models';

@Component({
  selector: 'app-product-group-status-badge',
  template: `<span class="status-badge" [class]="'status-badge--' + status()">{{ label() }}</span>`,
  styleUrl: './product-group-status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupStatusBadgeComponent {
  readonly status = input.required<ProductGroupStatus>();
  readonly label = input.required<string>();
}
