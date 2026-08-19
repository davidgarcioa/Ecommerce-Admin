import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { OrderListItem } from '../../data-access/office.models';
import { formatCurrency, formatDate, maskPhone } from '../../utils/office.formatters';

@Component({
  selector: 'app-orders-table',
  imports: [DataTableComponent],
  templateUrl: './orders-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersTableComponent {
  readonly orders = input.required<readonly OrderListItem[]>();
  readonly loading = input(false);
  readonly canUpdate = input(false);

  readonly rowClick = output<OrderListItem>();
  readonly actionClick = output<TableActionClick<OrderListItem>>();
  readonly selectionChange = output<readonly OrderListItem[]>();
  readonly retry = output<void>();

  readonly columns = computed<readonly TableColumn<OrderListItem>[]>(() => [
    {
      key: 'orderNumber',
      label: 'Pedido',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '9rem',
      align: 'left',
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'left',
      formatter: (value) => formatDate(String(value)),
    },
    {
      key: 'customerName',
      label: 'Cliente',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '12rem',
      align: 'left',
    },
    {
      key: 'customerPhone',
      label: 'Teléfono',
      type: 'text',
      sortable: false,
      searchable: true,
      visible: true,
      align: 'left',
      formatter: (value) => maskPhone(String(value)),
    },
    {
      key: 'city',
      label: 'Ciudad',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'total',
      label: 'Total',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'right',
      formatter: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'orderStatusLabel',
      label: 'Estado',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'paymentStatusLabel',
      label: 'Pago',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'deliveryStatusLabel',
      label: 'Entrega',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'confirmationLabel',
      label: 'Confirmación',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'priorityLabel',
      label: 'Prioridad',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'updatedAt',
      label: 'Actualización',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: false,
      align: 'left',
      formatter: (value) => formatDate(String(value)),
    },
  ]);

  readonly actions = computed<readonly TableAction<OrderListItem>[]>(() => [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    {
      id: 'edit',
      label: 'Editar',
      icon: 'edit',
      variant: 'default',
      hidden: () => !this.canUpdate(),
    },
    {
      id: 'confirm',
      label: 'Confirmar',
      icon: 'task_alt',
      variant: 'primary',
      hidden: (row) => !this.canUpdate() || row.orderStatus !== 'Pending',
    },
    {
      id: 'status',
      label: 'Cambiar estado',
      icon: 'sync_alt',
      variant: 'default',
      hidden: () => !this.canUpdate(),
    },
    { id: 'history', label: 'Historial', icon: 'history', variant: 'default' },
    { id: 'copy-phone', label: 'Copiar teléfono', icon: 'content_copy', variant: 'default' },
  ]);
}
