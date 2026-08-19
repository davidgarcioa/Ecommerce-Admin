import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { LOGISTICS_TABLE_PREFERENCES_KEY } from '../../utils/logistics.constants';
import { formatCurrency, formatDate, maskPhone } from '../../utils/logistics.formatters';
import { LogisticsOrderListItem } from '../../data-access/logistics.models';

@Component({
  selector: 'app-logistics-orders-table',
  imports: [DataTableComponent],
  templateUrl: './logistics-orders-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsOrdersTableComponent {
  readonly orders = input.required<readonly LogisticsOrderListItem[]>();
  readonly loading = input(false);
  readonly canUpdate = input(false);

  readonly rowClick = output<LogisticsOrderListItem>();
  readonly actionClick = output<TableActionClick<LogisticsOrderListItem>>();
  readonly retry = output<void>();

  protected readonly preferencesKey = LOGISTICS_TABLE_PREFERENCES_KEY;

  readonly columns = computed<readonly TableColumn<LogisticsOrderListItem>[]>(() => [
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
      visible: false,
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
      key: 'carrierLabel',
      label: 'Transportadora',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '10rem',
      align: 'left',
    },
    {
      key: 'trackingLabel',
      label: 'Guía',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '9rem',
      align: 'left',
    },
    {
      key: 'dispatchStateLabel',
      label: 'Despacho',
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
      key: 'incidentLabel',
      label: 'Novedades',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      align: 'left',
    },
    {
      key: 'total',
      label: 'Valor',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: false,
      align: 'right',
      formatter: (value) => formatCurrency(Number(value)),
    },
    {
      key: 'updatedAt',
      label: 'Actualización',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'left',
      formatter: (value) => formatDate(String(value)),
    },
  ]);

  readonly actions = computed<readonly TableAction<LogisticsOrderListItem>[]>(() => [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    {
      id: 'shipment',
      label: 'Registrar guía',
      icon: 'receipt_long',
      variant: 'default',
      hidden: () => !this.canUpdate(),
    },
    {
      id: 'delivery-status',
      label: 'Cambiar entrega',
      icon: 'sync_alt',
      variant: 'default',
      hidden: (row) => !this.canUpdate() || row.deliveryStatus === 'Delivered',
    },
    { id: 'history', label: 'Historial', icon: 'history', variant: 'default' },
    {
      id: 'copy-tracking',
      label: 'Copiar guía',
      icon: 'content_copy',
      variant: 'default',
      hidden: (row) => !row.trackingNumber,
    },
    { id: 'office', label: 'Abrir en Oficina', icon: 'business_center', variant: 'default' },
  ]);
}
