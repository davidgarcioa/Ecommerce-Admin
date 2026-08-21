import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { ProductGroupProduct } from '../../data-access/product-groups.models';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/product-group-formatters';

@Component({
  selector: 'app-product-group-products-table',
  imports: [DataTableComponent],
  templateUrl: './product-group-products-table.html',
  styleUrl: './product-group-products-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGroupProductsTableComponent {
  readonly products = input.required<readonly ProductGroupProduct[]>();
  readonly loading = input(false);
  readonly canManage = input(false);

  readonly remove = output<ProductGroupProduct>();
  readonly moveUp = output<ProductGroupProduct>();
  readonly moveDown = output<ProductGroupProduct>();

  readonly columns = computed<readonly TableColumn<ProductGroupProduct>[]>(() => [
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '8rem',
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
      key: 'status',
      label: 'Estado',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
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
      key: 'estimatedTotalCost',
      label: 'Costo',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'estimatedProfit',
      label: 'Ganancia',
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
    {
      key: 'variantCount',
      label: 'Variantes',
      type: 'number',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
    },
    {
      key: 'updatedAt',
      label: 'Actualizacion',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: false,
      align: 'left',
      formatter: (value) => formatDate(String(value)),
    },
  ]);

  readonly actions = computed<readonly TableAction<ProductGroupProduct>[]>(() =>
    this.canManage()
      ? [
          { id: 'up', label: 'Subir', icon: 'arrow_upward', variant: 'default' },
          { id: 'down', label: 'Bajar', icon: 'arrow_downward', variant: 'default' },
          {
            id: 'remove',
            label: 'Desasociar',
            icon: 'link_off',
            variant: 'danger',
            confirmationRequired: true,
            confirmationMessage: 'Desasociar este producto?',
          },
        ]
      : [],
  );

  onAction(event: TableActionClick<ProductGroupProduct>): void {
    switch (event.action.id) {
      case 'up':
        this.moveUp.emit(event.row);
        break;
      case 'down':
        this.moveDown.emit(event.row);
        break;
      case 'remove':
        this.remove.emit(event.row);
        break;
    }
  }
}
