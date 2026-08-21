import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { TableFilter } from '../../../../shared/components/data-table/models/table-filter.model';
import { CARRIERS, CITIES, ORDER_STATUSES } from '../../constants/daily-report.constants';
import { DailyOrder } from '../../models/daily-order.model';
import { formatDailyValue, maskPhone } from '../../utils/daily-report.utils';

type OrderInsightId = 'all' | 'urgent' | 'moving' | 'incidents' | 'revenue';
type OrderInsightTone = 'info' | 'positive' | 'warning' | 'danger';

interface OrderInsight {
  readonly id: OrderInsightId;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: string;
  readonly tone: OrderInsightTone;
}

@Component({
  selector: 'app-daily-orders-section',
  imports: [DataTableComponent],
  templateUrl: './daily-orders-section.html',
  styleUrls: ['./daily-orders-section.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyOrdersSectionComponent {
  readonly orders = input.required<readonly DailyOrder[]>();
  readonly loading = input(false);
  readonly rowClick = output<DailyOrder>();
  readonly actionClick = output<TableActionClick<DailyOrder>>();

  readonly selectedInsight = signal<OrderInsightId>('all');
  readonly totalOrders = computed(() => this.orders().length);
  readonly urgentOrders = computed(() => this.orders().filter((order) => order.urgent).length);
  readonly movingOrders = computed(
    () =>
      this.orders().filter(
        (order) => order.status === 'En tránsito' || order.status === 'Despachada',
      ).length,
  );
  readonly incidentOrders = computed(
    () =>
      this.orders().filter((order) => order.status === 'Devuelta' || order.status === 'Cancelada')
        .length,
  );
  readonly revenueOrders = computed(() => this.orders().filter((order) => order.orderValue > 0));
  readonly totalRevenue = computed(() =>
    this.revenueOrders().reduce((total, order) => total + order.orderValue, 0),
  );
  readonly filteredOrders = computed(() => {
    const selectedInsight = this.selectedInsight();

    switch (selectedInsight) {
      case 'urgent':
        return this.orders().filter((order) => order.urgent);
      case 'moving':
        return this.orders().filter(
          (order) => order.status === 'En tránsito' || order.status === 'Despachada',
        );
      case 'incidents':
        return this.orders().filter(
          (order) => order.status === 'Devuelta' || order.status === 'Cancelada',
        );
      case 'revenue':
        return this.revenueOrders();
      case 'all':
      default:
        return this.orders();
    }
  });
  readonly orderInsights = computed<readonly OrderInsight[]>(() => [
    {
      detail: 'Registros filtrados',
      icon: 'receipt_long',
      id: 'all',
      label: 'Órdenes',
      tone: 'info',
      value: formatDailyValue(this.totalOrders(), 'number'),
    },
    {
      detail: 'Requieren atención',
      icon: 'priority_high',
      id: 'urgent',
      label: 'Urgentes',
      tone: this.urgentOrders() > 0 ? 'warning' : 'positive',
      value: formatDailyValue(this.urgentOrders(), 'number'),
    },
    {
      detail: 'Despacho activo',
      icon: 'local_shipping',
      id: 'moving',
      label: 'En movimiento',
      tone: 'info',
      value: formatDailyValue(this.movingOrders(), 'number'),
    },
    {
      detail: 'Devueltas o canceladas',
      icon: 'report',
      id: 'incidents',
      label: 'Incidencias',
      tone: this.incidentOrders() > 0 ? 'danger' : 'positive',
      value: formatDailyValue(this.incidentOrders(), 'number'),
    },
    {
      detail: 'Valor operativo',
      icon: 'payments',
      id: 'revenue',
      label: 'Recaudo',
      tone: 'positive',
      value: formatCompactCurrency(this.totalRevenue()),
    },
  ]);

  readonly tableFilters = computed<readonly TableFilter<DailyOrder>[]>(() => [
    {
      key: 'status',
      label: 'Estado',
      options: ORDER_STATUSES.map((status) => ({ label: status, value: status })),
      type: 'status',
      value: null,
    },
    {
      key: 'carrier',
      label: 'Transportadora',
      options: CARRIERS.map((carrier) => ({ label: carrier, value: carrier })),
      type: 'select',
      value: null,
    },
    {
      key: 'city',
      label: 'Ciudad',
      options: CITIES.map((city) => ({ label: city, value: city })),
      type: 'select',
      value: null,
    },
    {
      key: 'urgent',
      label: 'Urgente',
      type: 'boolean',
      value: null,
    },
  ]);

  readonly columns: readonly TableColumn<DailyOrder>[] = [
    col('orderNumber', 'Orden', 'text', 'left', undefined, '8rem'),
    col('guideNumber', 'Guía', 'text', 'left', emptyText, '8rem'),
    col('status', 'Estado', 'status', 'left', undefined, '9rem'),
    col('guideStatus', 'Estado guía', 'text', 'left', emptyText, '9rem'),
    col('customerName', 'Cliente', 'text', 'left', undefined, '10rem'),
    col('productName', 'Producto', 'text', 'left', undefined, '13rem'),
    col('sku', 'SKU', 'text', 'left', emptyText, '7rem'),
    col('quantity', 'Cant.', 'number', 'right', optionalNumber, '5rem'),
    col('productGroupName', 'Conjunto', 'text', 'left', undefined, '9rem'),
    col('city', 'Ciudad', 'text', 'left', undefined, '8rem'),
    col('carrier', 'Transportadora', 'text', 'left', undefined, '10rem'),
    col('shippingType', 'Tipo envío', 'text', 'left', emptyText, '9rem'),
    col('orderValue', 'Valor', 'currency', 'right', undefined, '8rem'),
    col('estimatedProfit', 'Ganancia', 'currency', 'right', undefined, '8rem'),
    col('shippingCost', 'Flete', 'currency', 'right', optionalCurrency, '7rem'),
    col('operationDays', 'Días', 'number', 'right', undefined, '5rem'),
    col('urgent', 'Urgente', 'boolean', 'center', undefined, '6rem'),
    col('lastMovement', 'Último movimiento', 'text', 'left', emptyText, '12rem'),
    col('customerPhone', 'Teléfono', 'custom', 'left', (value) => maskPhone(String(value)), '8rem'),
    col('createdAt', 'Fecha', 'date', 'left', undefined, '9rem'),
  ];
  readonly actions: readonly TableAction<DailyOrder>[] = [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'edit-status', label: 'Editar estado', icon: 'edit', variant: 'default' },
    { id: 'urgent', label: 'Marcar urgente', icon: 'priority_high', variant: 'default' },
    { id: 'duplicate', label: 'Duplicar', icon: 'content_copy', variant: 'default' },
    { id: 'export', label: 'Exportar', icon: 'download', variant: 'default' },
    {
      id: 'cancel',
      label: 'Cancelar',
      icon: 'cancel',
      variant: 'danger',
      confirmationRequired: true,
    },
  ];

  selectInsight(insightId: OrderInsightId): void {
    this.selectedInsight.set(insightId);
  }
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$ ${Math.floor(value / 1_000_000)}M`;
  }

  return formatDailyValue(value, 'currency');
}

function emptyText(value: unknown): string {
  const text = String(value ?? '').trim();

  return text.length > 0 ? text : 'Sin dato';
}

function optionalNumber(value: unknown): string {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0
    ? formatDailyValue(numberValue, 'number')
    : 'Sin dato';
}

function optionalCurrency(value: unknown): string {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0
    ? formatDailyValue(numberValue, 'currency')
    : 'Sin dato';
}

function col(
  key: Extract<keyof DailyOrder, string>,
  label: string,
  type: TableColumn<DailyOrder>['type'],
  align: TableColumn<DailyOrder>['align'] = 'left',
  formatter?: TableColumn<DailyOrder>['formatter'],
  minWidth?: string,
): TableColumn<DailyOrder> {
  const defaultFormatter =
    type === 'currency'
      ? (value: DailyOrder[typeof key]) => formatDailyValue(Number(value), 'currency')
      : formatter;

  return {
    key,
    label,
    type,
    align,
    formatter: formatter ?? defaultFormatter,
    sortable: true,
    searchable: true,
    visible: true,
    minWidth,
  };
}
