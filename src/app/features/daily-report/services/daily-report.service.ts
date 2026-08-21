import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  defaultIfEmpty,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  timeout,
} from 'rxjs';

import {
  DeliveryStatus as BackendDeliveryStatus,
  Order,
  OrderQuery,
  OrderStatus as BackendOrderStatus,
  PaymentMethod as BackendPaymentMethod,
} from '../../office/data-access/office.models';
import { OfficeApiService } from '../../office/data-access/office-api.service';
import { DEFAULT_DAILY_REPORT_FILTER } from '../constants/daily-report.constants';
import { DailyMetric } from '../models/daily-metric.model';
import { DailyOrder, OrderStatus, PaymentMethod } from '../models/daily-order.model';
import { DailyReport, ReportExportOptions } from '../models/daily-report.model';
import { DailyReportFilter } from '../models/daily-report-filter.model';
import { ProductGroupPerformance } from '../models/product-group-performance.model';
import { ReportComparison } from '../models/report-comparison.model';
import { escapeCsv, formatDailyValue } from '../utils/daily-report.utils';
import { ImportedOrdersStoreService } from './imported-orders-store.service';

@Injectable({
  providedIn: 'root',
})
export class DailyReportService {
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);
  private readonly ordersApi = inject(OfficeApiService);
  private readonly ordersState = signal<readonly DailyOrder[]>([]);
  private readonly filtersState = signal<DailyReportFilter>(DEFAULT_DAILY_REPORT_FILTER);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly comparisonEnabledState = signal(false);
  private readonly exportPanelVisibleState = signal(false);
  private readonly selectedOrderState = signal<DailyOrder | null>(null);
  private readonly generatedAtState = signal(new Date().toISOString());

  readonly filters = this.filtersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly comparisonEnabled = this.comparisonEnabledState.asReadonly();
  readonly exportPanelVisible = this.exportPanelVisibleState.asReadonly();
  readonly selectedOrder = this.selectedOrderState.asReadonly();

  readonly filteredOrders = computed(() => this.resolveVisibleOrders());
  readonly orders = computed(() => this.resolveSourceOrders());
  readonly summaryMetrics = computed(() => this.createSummaryMetrics(this.filteredOrders()));
  readonly comparison = signal<readonly ReportComparison[]>([]).asReadonly();
  readonly productGroupPerformance = computed(() => this.createProductGroupPerformance());
  readonly operationalStatus = computed(() => this.createOperationalStatus(this.filteredOrders()));

  readonly report = computed<DailyReport>(() => ({
    generatedAt: this.generatedAtState(),
    selectedDate: this.filtersState().date,
    summaryMetrics: this.summaryMetrics(),
    comparison: this.comparison(),
    productGroupPerformance: this.productGroupPerformance(),
    operationalStatus: this.operationalStatus(),
    orders: this.filteredOrders(),
  }));

  loadReport(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.ensureVisibleReportData();

    this.loadBackendOrders()
      .pipe(
        take(1),
        finalize(() => this.loadingState.set(false)),
      )
      .subscribe({
        next: (orders) => {
          const mappedOrders = normalizeDailyOrders(
            orders.map((order) => mapBackendOrderToDailyOrder(order)),
          );
          this.ordersState.set(mappedOrders);
          this.generatedAtState.set(new Date().toISOString());
        },
        error: () => {
          this.ordersState.set(this.resolveFallbackOrders());
          this.errorState.set(null);
          this.generatedAtState.set(new Date().toISOString());
        },
      });
  }

  refreshReport(): void {
    this.loadReport();
  }

  activateDashboardReport(): void {
    this.filtersState.set(DEFAULT_DAILY_REPORT_FILTER);
    this.ordersState.set(this.resolveFallbackOrders());
    this.errorState.set(null);
    this.loadingState.set(false);
    this.closeOrderDetail();
    this.closeExportPanel();
    this.generatedAtState.set(new Date().toISOString());
  }

  private loadBackendOrders(): Observable<readonly Order[]> {
    const baseQuery = buildOrdersQuery(1);

    return this.ordersApi.listOrders(baseQuery).pipe(
      timeout({ first: 15000 }),
      switchMap((firstPage) => {
        const firstPageData = firstPage.data ?? [];
        const rawTotalPages = Number(firstPage.meta?.totalPages ?? 1);
        const totalPages =
          Number.isFinite(rawTotalPages) && rawTotalPages > 1 ? Math.min(rawTotalPages, 10) : 1;

        if (totalPages <= 1) return of(firstPageData);

        const pageRequests = Array.from({ length: totalPages - 1 }, (_, index) =>
          this.ordersApi.listOrders(buildOrdersQuery(index + 2)),
        );

        return forkJoin(pageRequests).pipe(
          map((pages) => [...firstPageData, ...pages.flatMap((page) => page.data ?? [])]),
        );
      }),
      defaultIfEmpty([]),
      catchError(() => of([])),
    );
  }

  private resolveFallbackOrders(): readonly DailyOrder[] {
    const importedOrders = normalizeDailyOrders(this.importedOrdersStore.orders());

    return importedOrders;
  }

  private ensureVisibleReportData(): void {
    if (this.filteredOrders().length > 0) {
      return;
    }

    this.filtersState.set(DEFAULT_DAILY_REPORT_FILTER);
    this.ordersState.set(this.resolveFallbackOrders());
    this.generatedAtState.set(new Date().toISOString());
  }

  private resolveVisibleOrders(): readonly DailyOrder[] {
    const filteredOrders = this.filterOrders(this.resolveSourceOrders(), this.filtersState());

    if (filteredOrders.length > 0) {
      return filteredOrders;
    }

    return this.filterOrders(this.resolveFallbackOrders(), DEFAULT_DAILY_REPORT_FILTER);
  }

  private resolveSourceOrders(): readonly DailyOrder[] {
    const sourceOrders = normalizeDailyOrders(this.ordersState());
    return sourceOrders.length > 0 ? sourceOrders : this.resolveFallbackOrders();
  }
  applyFilters(filters: DailyReportFilter): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set(DEFAULT_DAILY_REPORT_FILTER);
  }

  toggleComparison(): void {
    this.comparisonEnabledState.update((enabled) => !enabled);
  }

  selectOrder(order: DailyOrder): void {
    this.selectedOrderState.set(order);
  }

  closeOrderDetail(): void {
    this.selectedOrderState.set(null);
  }

  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.ordersState.set(
      this.resolveSourceOrders().map((order) =>
        order.id === orderId ? { ...order, status, lastUpdated: new Date().toISOString() } : order,
      ),
    );
    this.syncSelectedOrder(orderId);
  }

  toggleUrgent(orderId: string): void {
    this.ordersState.set(
      this.resolveSourceOrders().map((order) =>
        order.id === orderId
          ? { ...order, urgent: !order.urgent, lastUpdated: new Date().toISOString() }
          : order,
      ),
    );
    this.syncSelectedOrder(orderId);
  }

  cancelOrder(orderId: string): void {
    this.updateOrderStatus(orderId, 'Cancelada');
  }

  openExportPanel(): void {
    this.exportPanelVisibleState.set(true);
  }

  closeExportPanel(): void {
    this.exportPanelVisibleState.set(false);
  }

  exportReport(options: ReportExportOptions): string {
    const report = this.report();
    const orders = options.filteredOnly ? this.filteredOrders() : this.orders();

    if (options.format === 'json') {
      return JSON.stringify({ ...report, orders }, null, 2);
    }

    const rows = orders.map((order) =>
      [
        order.orderNumber,
        order.guideNumber ?? '',
        order.createdAt,
        order.customerName,
        order.customerPhone,
        order.customerEmail ?? '',
        order.productName,
        order.sku ?? '',
        String(order.quantity ?? ''),
        order.productGroupName,
        order.city,
        order.department ?? '',
        order.carrier,
        order.shippingType ?? '',
        order.status,
        order.guideStatus ?? '',
        formatDailyValue(order.orderValue, 'currency'),
        formatDailyValue(order.shippingCost ?? 0, 'currency'),
        formatDailyValue(order.commission ?? 0, 'currency'),
        formatDailyValue(order.estimatedProfit, 'currency'),
        order.lastMovement ?? '',
        order.lastMovementLocation ?? '',
        String(order.operationDays),
        order.urgent ? 'Sí' : 'No',
      ]
        .map(escapeCsv)
        .join(','),
    );
    const header = [
      'Orden',
      'Guía',
      'Fecha',
      'Cliente',
      'Teléfono',
      'Correo',
      'Producto',
      'SKU',
      'Cantidad',
      'Conjunto',
      'Ciudad',
      'Departamento',
      'Transportadora',
      'Tipo de envío',
      'Estado',
      'Estado de guía',
      'Valor',
      'Flete',
      'Comisión',
      'Ganancia estimada',
      'Último movimiento',
      'Ubicación movimiento',
      'Días en operación',
      'Urgente',
    ].join(',');

    return ['\uFEFF' + header, ...rows].join('\n');
  }

  private filterOrders(
    orders: readonly DailyOrder[],
    filters: DailyReportFilter,
  ): readonly DailyOrder[] {
    return normalizeDailyOrders(orders).filter(
      (order) =>
        (filters.productGroupId === 'all' || order.productGroupId === filters.productGroupId) &&
        (filters.orderStatus === 'Todos' || order.status === filters.orderStatus) &&
        (filters.carrier === 'Todas' || order.carrier === filters.carrier) &&
        (filters.city === 'Todas' || order.city === filters.city),
    );
  }

  private createSummaryMetrics(orders: readonly DailyOrder[]): readonly DailyMetric[] {
    const safeOrders = normalizeDailyOrders(orders);
    const deliveries = safeOrders.filter((order) => order.status === 'Entregada').length;
    const confirmed = safeOrders.filter(
      (order) => order.status !== 'Pendiente' && order.status !== 'Cancelada',
    ).length;
    const sales = safeOrders.reduce((total, order) => total + order.orderValue, 0);
    const adSpend = safeOrders.reduce((total, order) => total + order.advertisingCost, 0);
    const operationalCosts = safeOrders.reduce(
      (total, order) =>
        total +
        (order.shippingCost ?? 0) +
        (order.returnShippingCost ?? 0) +
        (order.commission ?? 0),
      0,
    );
    const acquisitionCostBase = adSpend > 0 ? adSpend : operationalCosts;
    const profit = safeOrders.reduce((total, order) => total + order.estimatedProfit, 0);
    const returns = safeOrders.filter((order) => order.status === 'Devuelta').length;
    const cancelled = safeOrders.filter((order) => order.status === 'Cancelada').length;
    const urgent = safeOrders.filter((order) => order.urgent).length;
    const deliveryRate = confirmed === 0 ? 0 : (deliveries / confirmed) * 100;
    const cpa = confirmed === 0 ? 0 : acquisitionCostBase / confirmed;
    const roas = acquisitionCostBase === 0 ? 0 : sales / acquisitionCostBase;

    return [
      metric(
        'orders',
        'Órdenes recibidas',
        safeOrders.length,
        'Órdenes filtradas',
        'receipt_long',
        'number',
      ),
      metric(
        'confirmed',
        'Órdenes confirmadas',
        confirmed,
        'Validación comercial',
        'fact_check',
        'number',
        'positive',
      ),
      metric(
        'sales',
        'Ventas totales',
        sales,
        'Recaudo filtrado',
        'payments',
        'currency',
        'positive',
      ),
      metric(
        'deliveries',
        'Entregas',
        deliveries,
        'Paquetes entregados',
        'local_shipping',
        'number',
        'positive',
      ),
      metric(
        'delivery-rate',
        'Tasa de entrega',
        deliveryRate,
        'Efectividad operativa',
        'percent',
        'percentage',
      ),
      metric(
        'profit',
        'Ganancia estimada',
        profit,
        'Después de costos',
        'wallet',
        'currency',
        'positive',
      ),
      metric(
        'ad-spend',
        adSpend > 0 ? 'Gasto publicitario' : 'Costos operativos',
        acquisitionCostBase,
        adSpend > 0 ? 'Inversión filtrada' : 'Flete y comisiones',
        'campaign',
        'currency',
      ),
      metric(
        'roas',
        'ROAS',
        roas,
        adSpend > 0 ? 'Recaudo / pauta' : 'Ventas / costos',
        'query_stats',
        'multiplier',
        'positive',
      ),
      metric('cpa', 'CPA', cpa, 'Costo por adquisición', 'ads_click', 'currency', 'critical'),
      metric(
        'returns',
        'Devoluciones',
        returns,
        'Casos registrados',
        'assignment_return',
        'number',
        'critical',
      ),
      metric(
        'cancelled',
        'Cancelaciones',
        cancelled,
        'Órdenes canceladas',
        'cancel',
        'number',
        'warning',
      ),
      metric(
        'urgent',
        'Órdenes urgentes',
        urgent,
        'Requieren atención',
        'priority_high',
        'number',
        'warning',
      ),
    ];
  }

  private createProductGroupPerformance(): readonly ProductGroupPerformance[] {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        products: Set<string>;
        orders: number;
        sales: number;
        deliveries: number;
        returns: number;
        adSpend: number;
        estimatedProfit: number;
      }
    >();

    this.filteredOrders().forEach((order) => {
      const existing = groups.get(order.productGroupId) ?? {
        id: order.productGroupId,
        name: order.productGroupName,
        products: new Set<string>(),
        orders: 0,
        sales: 0,
        deliveries: 0,
        returns: 0,
        adSpend: 0,
        estimatedProfit: 0,
      };

      existing.products.add(order.productName);
      existing.orders += 1;
      existing.sales += order.orderValue;
      existing.deliveries += order.status === 'Entregada' ? 1 : 0;
      existing.returns += order.status === 'Devuelta' ? 1 : 0;
      existing.adSpend +=
        order.advertisingCost +
        (order.shippingCost ?? 0) +
        (order.returnShippingCost ?? 0) +
        (order.commission ?? 0);
      existing.estimatedProfit += order.estimatedProfit;
      groups.set(order.productGroupId, existing);
    });

    return Array.from(groups.values())
      .map((group) => ({
        id: group.id,
        name: group.name,
        productCount: group.products.size,
        orders: group.orders,
        sales: group.sales,
        deliveries: group.deliveries,
        deliveryRate: group.orders === 0 ? 0 : (group.deliveries / group.orders) * 100,
        returns: group.returns,
        cpa: group.orders === 0 ? 0 : group.adSpend / group.orders,
        roas: group.adSpend === 0 ? 0 : group.sales / group.adSpend,
        estimatedProfit: group.estimatedProfit,
      }))
      .sort((first, second) => second.sales - first.sales);
  }

  private createOperationalStatus(orders: readonly DailyOrder[]) {
    const total = Math.max(orders.length, 1);
    const statuses: readonly OrderStatus[] = [
      'Pendiente',
      'Confirmada',
      'En preparación',
      'Despachada',
      'En tránsito',
      'Entregada',
      'Devuelta',
      'Cancelada',
    ];

    return statuses.map((status) => {
      const count = orders.filter((order) => order.status === status).length;
      return { status, count, percentage: (count / total) * 100 };
    });
  }

  private syncSelectedOrder(orderId: string): void {
    const selectedOrder = this.selectedOrderState();
    if (selectedOrder?.id === orderId) {
      this.selectedOrderState.set(this.orders().find((order) => order.id === orderId) ?? null);
    }
  }
}

function metric(
  id: string,
  title: string,
  value: number,
  subtitle: string,
  icon: string,
  format: DailyMetric['format'],
  status: DailyMetric['status'] = 'default',
): DailyMetric {
  return {
    id,
    title,
    value,
    formattedValue: formatDailyValue(value, format),
    subtitle,
    icon,
    format,
    status,
  };
}

const ORDER_STATUS_VALUES: readonly OrderStatus[] = [
  'Pendiente',
  'Confirmada',
  'En preparación',
  'Despachada',
  'En tránsito',
  'Entregada',
  'Devuelta',
  'Cancelada',
];

const PAYMENT_METHOD_VALUES: readonly PaymentMethod[] = [
  'Contraentrega',
  'Transferencia',
  'Tarjeta',
  'PSE',
  'Otro',
];

function normalizeDailyOrders(orders: readonly unknown[]): readonly DailyOrder[] {
  return orders
    .map((order, index) => normalizeDailyOrder(order, index))
    .filter((order): order is DailyOrder => order !== null);
}

function normalizeDailyOrder(value: unknown, index: number): DailyOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const orderNumber = readRequiredText(value, 'orderNumber') || readRequiredText(value, 'id');
  const productName = readRequiredText(value, 'productName');
  const customerName = readRequiredText(value, 'customerName') || 'Cliente sin nombre';

  if (!orderNumber || !productName) {
    return null;
  }

  const createdAt = readRequiredText(value, 'createdAt') || new Date().toISOString();
  const productGroupName =
    readRequiredText(value, 'productGroupName') ||
    readRequiredText(value, 'productGroupId') ||
    'General';
  const productGroupId =
    readRequiredText(value, 'productGroupId') || normalizeId(productGroupName || productName);
  const orderValue = readFiniteNumber(value, 'orderValue', 0);
  const shippingCost = readFiniteNumber(value, 'shippingCost', 0);
  const commission = readFiniteNumber(value, 'commission', Math.round(orderValue * 0.03));
  const providerCostTotal = readFiniteNumber(value, 'providerCostTotal', 0);
  const advertisingCost = readFiniteNumber(value, 'advertisingCost', 0);
  const estimatedProfit = readFiniteNumber(
    value,
    'estimatedProfit',
    Math.max(orderValue - shippingCost - commission - providerCostTotal - advertisingCost, 0),
  );

  return {
    id: readRequiredText(value, 'id') || `daily-order-${index}-${orderNumber}`,
    orderNumber,
    createdAt,
    reportDate: readOptionalText(value, 'reportDate') || createdAt.slice(0, 10),
    orderHour: readOptionalText(value, 'orderHour') || formatOrderHour(createdAt),
    customerName,
    customerPhone: readRequiredText(value, 'customerPhone') || 'Sin telefono',
    customerEmail: readOptionalText(value, 'customerEmail'),
    customerDocumentType: readOptionalText(value, 'customerDocumentType'),
    customerDocumentNumber: readOptionalText(value, 'customerDocumentNumber'),
    productName,
    productGroupId,
    productGroupName,
    guideNumber: readOptionalText(value, 'guideNumber'),
    guideStatus: readOptionalText(value, 'guideStatus') || toOrderStatus(value['status']),
    shippingType: readOptionalText(value, 'shippingType'),
    department: readOptionalText(value, 'department'),
    city: readRequiredText(value, 'city') || 'Sin ciudad',
    address: readOptionalText(value, 'address'),
    notes: readOptionalText(value, 'notes'),
    carrier: readRequiredText(value, 'carrier') || 'Sin transportadora',
    status: toOrderStatus(value['status']),
    orderValue,
    advertisingCost,
    estimatedProfit,
    shippingCost,
    returnShippingCost: readFiniteNumber(value, 'returnShippingCost', 0),
    commission,
    commissionPercentage: readFiniteNumber(value, 'commissionPercentage', 3),
    providerCost: readOptionalNumber(value, 'providerCost'),
    providerCostTotal,
    productId: readOptionalText(value, 'productId'),
    sku: readOptionalText(value, 'sku'),
    variationId: readOptionalText(value, 'variationId'),
    variation: readOptionalText(value, 'variation'),
    quantity: readFiniteNumber(value, 'quantity', 1),
    novelty: readOptionalText(value, 'novelty'),
    noveltySolved: readOptionalBoolean(value, 'noveltySolved'),
    noveltyAt: readOptionalText(value, 'noveltyAt'),
    solution: readOptionalText(value, 'solution'),
    solvedAt: readOptionalText(value, 'solvedAt'),
    observation: readOptionalText(value, 'observation'),
    lastMovementAt: readOptionalText(value, 'lastMovementAt'),
    lastMovement: readOptionalText(value, 'lastMovement'),
    lastMovementConcept: readOptionalText(value, 'lastMovementConcept'),
    lastMovementLocation: readOptionalText(value, 'lastMovementLocation'),
    seller: readOptionalText(value, 'seller'),
    storeType: readOptionalText(value, 'storeType'),
    storeName: readOptionalText(value, 'storeName'),
    storeOrderId: readOptionalText(value, 'storeOrderId'),
    storeOrderNumber: readOptionalText(value, 'storeOrderNumber'),
    tags: readOptionalText(value, 'tags'),
    guideGeneratedAt: readOptionalText(value, 'guideGeneratedAt'),
    indemnizationCount: readOptionalNumber(value, 'indemnizationCount'),
    lastIndemnizationConcept: readOptionalText(value, 'lastIndemnizationConcept'),
    operationDays: readFiniteNumber(value, 'operationDays', calculateOperationDays(createdAt)),
    urgent: readOptionalBoolean(value, 'urgent') ?? false,
    paymentMethod: toPaymentMethod(value['paymentMethod']),
    lastUpdated: readRequiredText(value, 'lastUpdated') || new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredText(record: Record<string, unknown>, key: string): string {
  return readOptionalText(record, key) ?? '';
}

function readOptionalText(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readFiniteNumber(record: Record<string, unknown>, key: string, fallback: number): number {
  return readOptionalNumber(record, key) ?? fallback;
}

function readOptionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  const numberValue =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function readOptionalBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = normalizeText(value).trim();
    if (['true', 'si', 'yes', '1'].includes(normalized)) return true;
    if (['false', 'no', '0'].includes(normalized)) return false;
  }

  return undefined;
}

function toOrderStatus(value: unknown): OrderStatus {
  if (typeof value === 'string') {
    const normalizedValue = normalizeText(value).replace(/\s+/g, ' ').trim();
    const matchedStatus = ORDER_STATUS_VALUES.find(
      (status) => normalizeText(status) === normalizedValue,
    );
    if (matchedStatus) return matchedStatus;

    if (normalizedValue.includes('entreg')) return 'Entregada';
    if (normalizedValue.includes('devol')) return 'Devuelta';
    if (normalizedValue.includes('cancel')) return 'Cancelada';
    if (normalizedValue.includes('transito') || normalizedValue.includes('ruta'))
      return 'En tránsito';
    if (normalizedValue.includes('despach')) return 'Despachada';
    if (normalizedValue.includes('prepar') || normalizedValue.includes('bodega'))
      return 'En preparación';
    if (normalizedValue.includes('confirm')) return 'Confirmada';
  }

  return 'Pendiente';
}

function toPaymentMethod(value: unknown): PaymentMethod {
  if (typeof value === 'string') {
    const normalizedValue = normalizeText(value);
    const matchedMethod = PAYMENT_METHOD_VALUES.find(
      (method) => normalizeText(method) === normalizedValue,
    );
    if (matchedMethod) return matchedMethod;

    if (normalizedValue.includes('contra')) return 'Contraentrega';
    if (normalizedValue.includes('transfer')) return 'Transferencia';
    if (normalizedValue.includes('tarjeta') || normalizedValue.includes('card')) return 'Tarjeta';
    if (normalizedValue.includes('pse')) return 'PSE';
  }

  return 'Otro';
}

function buildOrdersQuery(page: number): OrderQuery {
  return {
    page,
    pageSize: 100,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    search: '',
    filters: {
      orderStatus: 'all',
      paymentStatus: 'all',
      deliveryStatus: 'all',
      city: '',
      carrier: '',
      urgent: 'all',
      pendingConfirmation: false,
      dateFrom: '',
      dateTo: '',
    },
  };
}

function mapBackendOrderToDailyOrder(order: Order): DailyOrder {
  const metadata = order.metadata;
  const rawGuideStatus =
    readString(metadata, 'guideStatus') ??
    readString(metadata, 'rawStatus') ??
    order.deliveryStatus;
  const returnShippingCost = readNumber(metadata, 'returnShippingCost') ?? 0;
  const providerCost = readNumber(metadata, 'providerCost');
  const providerCostTotal = readNumber(metadata, 'providerCostTotal') ?? 0;
  const commission = readNumber(metadata, 'commission') ?? estimateCommission(order.total);
  const storedEstimatedProfit = readNumber(metadata, 'estimatedProfit');
  const operationalCost =
    order.shippingCost + order.discount + returnShippingCost + providerCostTotal + commission;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    reportDate: order.createdAt.slice(0, 10),
    orderHour: formatOrderHour(order.createdAt),
    customerName: order.customerName || 'Cliente sin nombre',
    customerPhone: order.customerPhone || 'Sin teléfono',
    customerEmail: order.customerEmail,
    productName: order.productName || 'Producto sin nombre',
    productGroupId:
      order.productGroupId || normalizeId(order.productGroupName || order.productName || 'dropi'),
    productGroupName: order.productGroupName || order.productName || 'Dropi',
    guideNumber: order.trackingNumber,
    guideStatus: normalizeDisplayText(rawGuideStatus),
    department: order.department,
    city: order.city || 'Sin ciudad',
    address: order.address,
    notes: order.observations,
    carrier: order.carrier || 'Sin transportadora',
    status: mapBackendStatus(order.orderStatus, order.deliveryStatus, rawGuideStatus),
    orderValue: order.total,
    advertisingCost: 0,
    estimatedProfit: storedEstimatedProfit ?? Math.max(order.total - operationalCost, 0),
    shippingCost: order.shippingCost,
    returnShippingCost,
    commission,
    providerCost,
    providerCostTotal,
    productId: order.productId,
    sku: readString(metadata, 'sku'),
    quantity: order.quantity,
    novelty: readString(metadata, 'novelty') ?? order.observations,
    operationDays: calculateOperationDays(order.createdAt),
    urgent: order.urgent,
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    lastUpdated: order.updatedAt,
  };
}

function mapBackendStatus(
  orderStatus: BackendOrderStatus,
  deliveryStatus: BackendDeliveryStatus,
  guideStatus?: string,
): OrderStatus {
  const normalizedGuide = normalizeText(guideStatus ?? '');

  if (orderStatus === 'Cancelled') return 'Cancelada';
  if (orderStatus === 'Returned' || orderStatus === 'Refunded') return 'Devuelta';
  if (
    orderStatus === 'Delivered' ||
    deliveryStatus === 'Delivered' ||
    normalizedGuide.includes('entreg')
  ) {
    return 'Entregada';
  }
  if (
    orderStatus === 'Shipped' ||
    deliveryStatus === 'In Transit' ||
    normalizedGuide.includes('ruta') ||
    normalizedGuide.includes('transito') ||
    normalizedGuide.includes('despach')
  ) {
    return 'En tránsito';
  }
  if (
    orderStatus === 'Packed' ||
    orderStatus === 'Processing' ||
    deliveryStatus === 'Assigned' ||
    normalizedGuide.includes('bodega') ||
    normalizedGuide.includes('recog')
  ) {
    return 'En preparación';
  }
  if (orderStatus === 'Confirmed' || normalizedGuide.includes('confirm')) return 'Confirmada';
  return 'Pendiente';
}

function mapPaymentMethod(method: BackendPaymentMethod): PaymentMethod {
  const labels: Readonly<Record<BackendPaymentMethod, PaymentMethod>> = {
    'Cash on Delivery': 'Contraentrega',
    Transfer: 'Transferencia',
    Card: 'Tarjeta',
    PSE: 'PSE',
    Other: 'Otro',
  };

  return labels[method];
}

function readString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(
  metadata: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  const value = metadata?.[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  const compactValue = value.replace(/[^\d,.-]/g, '');
  const normalizedValue =
    compactValue.includes('.') && compactValue.includes(',')
      ? compactValue.replace(/\./g, '').replace(',', '.')
      : compactValue.includes(',') && !compactValue.includes('.')
        ? compactValue.replace(',', '.')
        : compactValue.split('.').at(-1)?.length === 3
          ? compactValue.replace(/\./g, '')
          : compactValue;
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function estimateCommission(total: number): number {
  return Math.round(Math.max(total, 0) * 0.03);
}

function calculateOperationDays(createdAt: string): number {
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return 0;

  const millisecondsPerDay = 86_400_000;
  return Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / millisecondsPerDay));
}

function formatOrderHour(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeDisplayText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase();

  return normalized
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

function normalizeId(value: string): string {
  return (
    normalizeText(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'dropi'
  );
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
