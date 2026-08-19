import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { ProductGroupProduct } from '../../data-access/product-groups.models';
import { formatCurrency, formatPercentage } from '../../utils/product-group-formatters';

@Component({
  selector: 'app-associate-products-dialog',
  imports: [DataTableComponent],
  templateUrl: './associate-products-dialog.html',
  styleUrl: './associate-products-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociateProductsDialogComponent {
  readonly products = input.required<readonly ProductGroupProduct[]>();
  readonly associatedProductIds = input.required<readonly string[]>();
  readonly loading = input(false);

  readonly search = output<string>();
  readonly close = output<void>();
  readonly associate = output<readonly string[]>();

  readonly selectedIds = signal<readonly string[]>([]);

  readonly availableProducts = computed(() => {
    const associated = new Set(this.associatedProductIds());
    return this.products().filter((product) => !associated.has(product.id));
  });

  readonly columns = computed<readonly TableColumn<ProductGroupProduct>[]>(() => [
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'name',
      label: 'Producto',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '14rem',
      align: 'left',
    },
    {
      key: 'salePrice',
      label: 'Precio',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'estimatedProfitMargin',
      label: 'Margen',
      type: 'percentage',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatPercentage(Number(value)),
    },
  ]);

  onSelection(products: readonly ProductGroupProduct[]): void {
    this.selectedIds.set(products.map((product) => product.id));
  }

  submit(): void {
    if (this.selectedIds().length > 0) {
      this.associate.emit(this.selectedIds());
    }
  }
}
