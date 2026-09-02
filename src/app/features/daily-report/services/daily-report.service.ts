import { computed, inject, Injectable, signal } from '@angular/core';
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
    this.ordersState.set(this.resolveFallbackOrders());
    this.generatedAtState.set(new Date().toISOString());
    this.loadingState.set(false);
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
