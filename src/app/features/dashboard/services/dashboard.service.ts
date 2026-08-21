import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, Observable, of, take, timeout } from 'rxjs';

import { FilesApiService } from '../../files/data-access/files-api.service';
import { FileStatistics } from '../../files/data-access/files.models';
import { TagsApiService } from '../../labels/data-access/tags-api.service';
import { TagStatistics } from '../../labels/data-access/tags.models';
import { OfficeApiService } from '../../office/data-access/office-api.service';
import { Order, OrderQuery, OrderStatistics } from '../../office/data-access/office.models';
import { ProductGroupsApiService } from '../../product-groups/data-access/product-groups-api.service';
import {
  ProductGroup as BackendProductGroup,
  ProductGroupStatistics,
} from '../../product-groups/data-access/product-groups.models';
import { TestingApiService } from '../../testing/data-access/testing-api.service';
import { TestingStatistics } from '../../testing/data-access/testing.models';
import {
  DEFAULT_DASHBOARD_FILTER,
  GENERAL_PRODUCT_GROUP_ID,
} from '../constants/dashboard.constants';
import { DashboardFilter } from '../models/dashboard-filter.model';
import { DashboardMetric, MetricFormat, MetricStatus } from '../models/dashboard-metric.model';
import { DashboardSummary } from '../models/dashboard-summary.model';
import {
  CreateProductGroupData,
  ProductGroup,
  UpdateProductGroupData,
} from '../models/product-group.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly ordersApi = inject(OfficeApiService);
  private readonly productGroupsApi = inject(ProductGroupsApiService);
  private readonly tagsApi = inject(TagsApiService);
  private readonly filesApi = inject(FilesApiService);
  private readonly testingApi = inject(TestingApiService);

  private readonly productGroupsState = signal<readonly ProductGroup[]>([
    createGeneralProductGroup(),
  ]);
  private readonly ordersState = signal<readonly Order[]>([]);
  private readonly orderStatisticsState = signal<OrderStatistics | null>(null);
  private readonly productGroupStatisticsState = signal<ProductGroupStatistics | null>(null);
  private readonly tagStatisticsState = signal<TagStatistics | null>(null);
  private readonly fileStatisticsState = signal<FileStatistics | null>(null);
  private readonly testingStatisticsState = signal<TestingStatistics | null>(null);
  private readonly filtersState = signal<DashboardFilter>(DEFAULT_DASHBOARD_FILTER);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filterPanelVisibleState = signal(false);
  private readonly noticeState = signal<string | null>(null);
  private readonly pendingDeleteProductGroupIdState = signal<string | null>(null);

  readonly filters = this.filtersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly filterPanelVisible = this.filterPanelVisibleState.asReadonly();
  readonly notice = this.noticeState.asReadonly();
  readonly pendingDeleteProductGroupId = this.pendingDeleteProductGroupIdState.asReadonly();

  readonly productGroups = computed(() =>
    this.productGroupsState().map((productGroup) => ({
      ...productGroup,
      isActive: productGroup.id === this.filtersState().productGroupId,
    })),
  );

  readonly selectedProductGroup = computed(() => {
    const selectedId = this.filtersState().productGroupId;

    return (
      this.productGroups().find((productGroup) => productGroup.id === selectedId) ??
      this.productGroups()[0]
    );
  });

  private readonly selectedOrders = computed(() => {
    const selectedId = this.filtersState().productGroupId;
    const orders = this.ordersState();

    return selectedId === GENERAL_PRODUCT_GROUP_ID
      ? orders
      : orders.filter((order) => order.productGroupId === selectedId);
  });

  readonly primaryMetrics = computed(() => this.createMetrics().primaryMetrics);
  readonly operationalMetrics = computed(() => this.createMetrics().operationalMetrics);

  readonly summary = computed<DashboardSummary>(() => ({
    generatedAt: new Date().toISOString(),
    selectedProductGroupId: this.filtersState().productGroupId,
    primaryMetrics: this.primaryMetrics(),
    operationalMetrics: this.operationalMetrics(),
    productGroups: this.productGroups(),
  }));

  readonly hasData = computed(
    () => this.primaryMetrics().length > 0 || this.operationalMetrics().length > 0,
  );

  readonly filterMessage = computed(() => {
    const group = this.selectedProductGroup();

    if (!group) return 'Sin datos conectados.';

    return group.id === GENERAL_PRODUCT_GROUP_ID
      ? 'Vista general aplicada.'
      : `Filtro aplicado: ${group.name}.`;
  });

  loadDashboard(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.noticeState.set(null);

    forkJoin({
      orders: this.safeLoad(this.ordersApi.listOrders(this.buildOrdersQuery())),
      orderStatistics: this.safeLoad(this.ordersApi.getStatistics(this.buildOrdersQuery())),
      productGroups: this.safeLoad(this.productGroupsApi.listGroups()),
      productGroupStatistics: this.safeLoad(this.productGroupsApi.statistics()),
      tagStatistics: this.safeLoad(this.tagsApi.statistics()),
      fileStatistics: this.safeLoad(this.filesApi.statistics()),
      testingStatistics: this.safeLoad(this.testingApi.statistics()),
    })
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          const orders = data.orders?.data ?? [];
          const productGroups = data.productGroups ?? [];

          this.ordersState.set(orders);
          this.orderStatisticsState.set(data.orderStatistics);
          this.productGroupStatisticsState.set(data.productGroupStatistics);
          this.tagStatisticsState.set(data.tagStatistics);
          this.fileStatisticsState.set(data.fileStatistics);
          this.testingStatisticsState.set(data.testingStatistics);
          this.productGroupsState.set(this.toDashboardProductGroups(productGroups, orders));
          this.loadingState.set(false);
          this.noticeState.set(this.buildLoadNotice(data));
        },
        error: () => {
          this.loadingState.set(false);
          this.errorState.set('No fue posible cargar el dashboard.');
        },
      });
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }

  selectProductGroup(id: string): void {
    this.updateFilters({
      ...this.filtersState(),
      productGroupId: id,
    });
  }

  updateFilters(filters: DashboardFilter): void {
    this.filtersState.set(filters);
    this.noticeState.set(this.filterMessage());
    this.loadDashboard();
  }

  clearFilters(): void {
    this.filtersState.set(DEFAULT_DASHBOARD_FILTER);
    this.noticeState.set('Filtros limpiados.');
    this.loadDashboard();
  }

  toggleFilterPanel(): void {
    this.filterPanelVisibleState.update((visible) => !visible);
  }

  createProductGroup(data: CreateProductGroupData): void {
    const normalizedId = this.createProductGroupId(data.name);
    const productGroup: ProductGroup = {
      id: normalizedId,
      name: data.name.trim(),
      productCount: data.productCount,
      status: data.status,
      description: data.description.trim(),
      isActive: false,
      lastUpdated: new Date().toISOString(),
      metrics: null,
    };

    this.productGroupsState.update((productGroups) => [...productGroups, productGroup]);
    this.noticeState.set(`Conjunto creado: ${productGroup.name}.`);
  }

  updateProductGroup(data: UpdateProductGroupData): void {
    this.productGroupsState.update((productGroups) =>
      productGroups.map((productGroup) =>
        productGroup.id === data.id
          ? {
              ...productGroup,
              name: data.name.trim(),
              description: data.description.trim(),
              productCount: data.productCount,
              status: data.status,
              lastUpdated: new Date().toISOString(),
            }
          : productGroup,
      ),
    );
    this.noticeState.set(`Conjunto actualizado: ${data.name}.`);
  }

  duplicateProductGroup(id: string): void {
    const source = this.productGroupsState().find((productGroup) => productGroup.id === id);

    if (!source) return;

    this.createProductGroup({
      name: `${source.name} copia`,
      description: source.description,
      productCount: source.productCount,
      status: source.status,
    });
  }

  deleteProductGroup(id: string): void {
    if (id === GENERAL_PRODUCT_GROUP_ID) {
      this.noticeState.set('La vista general no se puede eliminar.');
      return;
    }

    this.pendingDeleteProductGroupIdState.set(id);
    this.noticeState.set('Confirma la eliminacion del conjunto.');
  }

  confirmDeleteProductGroup(): void {
    const pendingId = this.pendingDeleteProductGroupIdState();

    if (!pendingId) return;

    this.productGroupsState.update((productGroups) =>
      productGroups.filter((productGroup) => productGroup.id !== pendingId),
    );

    if (this.filtersState().productGroupId === pendingId) {
      this.filtersState.set(DEFAULT_DASHBOARD_FILTER);
    }

    this.pendingDeleteProductGroupIdState.set(null);
    this.noticeState.set('Conjunto eliminado.');
  }

  cancelDeleteProductGroup(): void {
    this.pendingDeleteProductGroupIdState.set(null);
    this.noticeState.set(null);
  }

  retryDashboard(): void {
    this.loadDashboard();
  }

  private createMetrics(): Pick<DashboardSummary, 'primaryMetrics' | 'operationalMetrics'> {
    const selectedOrders = this.selectedOrders();
    const selectedOrderStats = this.createOrderStatistics(selectedOrders);
    const backendOrderStats = this.orderStatisticsState();
    const orderStats =
      this.filtersState().productGroupId === GENERAL_PRODUCT_GROUP_ID && backendOrderStats
        ? backendOrderStats
        : selectedOrderStats;
    const productGroupStats = this.productGroupStatisticsState();
    const tagStats = this.tagStatisticsState();
    const fileStats = this.fileStatisticsState();
    const testingStats = this.testingStatisticsState();
    const deliveredRate =
      orderStats.totalOrders === 0 ? 0 : (orderStats.delivered / orderStats.totalOrders) * 100;
    const cancelledRate =
      orderStats.totalOrders === 0 ? 0 : (orderStats.cancelled / orderStats.totalOrders) * 100;
    const ordersStatus = this.resolveStatus(backendOrderStats ?? selectedOrders.length);

    return {
      primaryMetrics: [
        metric(
          'total-sales',
          'Ventas',
          orderStats.sales,
          'Valor vendido en el periodo',
          'payments',
          'currency',
          ordersStatus,
          orderStats.totalOrders > 0 ? `${orderStats.totalOrders} ordenes` : null,
        ),
        metric(
          'total-orders',
          'Ordenes',
          orderStats.totalOrders,
          'Pedidos registrados',
          'receipt_long',
          'number',
          ordersStatus,
          `${orderStats.urgent} urgentes`,
        ),
        metric(
          'average-ticket',
          'Ticket promedio',
          orderStats.averageTicket,
          'Promedio por orden',
          'shopping_cart',
          'currency',
          ordersStatus,
        ),
        metric(
          'delivered-rate',
          'Tasa de entrega',
          deliveredRate,
          'Ordenes entregadas',
          'local_shipping',
          'percentage',
          deliveredRate >= 60 ? 'positive' : deliveredRate >= 35 ? 'warning' : 'critical',
          `${orderStats.delivered} entregadas`,
        ),
        metric(
          'estimated-profit',
          'Ganancia estimada',
          productGroupStats?.estimatedProfit ?? 0,
          'Conjuntos de productos',
          'account_balance_wallet',
          'currency',
          this.resolveStatus(productGroupStats),
          productGroupStats ? `${formatPercentage(productGroupStats.averageMargin)} margen` : null,
        ),
      ],
      operationalMetrics: [
        metric(
          'in-transit',
          'En transito',
          orderStats.inTransit,
          'Pedidos en movimiento',
          'route',
          'number',
          ordersStatus,
        ),
        metric(
          'cancelled-rate',
          'Cancelaciones',
          cancelledRate,
          'Proporcion cancelada',
          'cancel',
          'percentage',
          cancelledRate > 12 ? 'critical' : cancelledRate > 6 ? 'warning' : 'positive',
          `${orderStats.cancelled} canceladas`,
        ),
        metric(
          'pending-value',
          'Valor pendiente',
          orderStats.pendingValue,
          'Por recaudar',
          'pending_actions',
          'currency',
          ordersStatus,
        ),
        metric(
          'product-groups',
          'Conjuntos activos',
          productGroupStats?.active ??
            this.productGroupsState().filter((group) => group.status === 'Activo').length,
          'Catalogo comercial',
          'category',
          'number',
          this.resolveStatus(productGroupStats ?? this.productGroupsState().length),
          productGroupStats ? `${productGroupStats.associatedProducts} productos asociados` : null,
        ),
        metric(
          'tags',
          'Etiquetas activas',
          tagStats?.active ?? 0,
          'Segmentacion disponible',
          'sell',
          'number',
          this.resolveStatus(tagStats),
          tagStats?.mostUsedTag ? `Mas usada: ${tagStats.mostUsedTag.name}` : null,
        ),
        metric(
          'files',
          'Archivos activos',
          fileStats?.active ?? 0,
          'Soportes y evidencias',
          'folder',
          'number',
          this.resolveStatus(fileStats),
          fileStats ? `${formatBytes(fileStats.totalSize)} almacenados` : null,
        ),
        metric(
          'tests-active',
          'Testeos activos',
          testingStats?.active ?? 0,
          'Experimentos en curso',
          'science',
          'number',
          this.resolveStatus(testingStats),
          testingStats ? `${testingStats.completed} completados` : null,
        ),
        metric(
          'sold-value',
          'Valor pagado',
          orderStats.soldValue,
          'Ingresos confirmados',
          'verified',
          'currency',
          ordersStatus,
        ),
      ],
    };
  }

  private safeLoad<T>(request: Observable<T>): Observable<T | null> {
    return request.pipe(
      timeout({ first: 12000 }),
      catchError(() => of(null)),
    );
  }

  private buildOrdersQuery(): OrderQuery {
    const range = resolveDateRange(this.filtersState());

    return {
      page: 1,
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
        dateFrom: range.dateFrom ?? '',
        dateTo: range.dateTo ?? '',
      },
    };
  }

  private toDashboardProductGroups(
    groups: readonly BackendProductGroup[],
    orders: readonly Order[],
  ): readonly ProductGroup[] {
    const generalMetrics = this.createGroupMetrics(GENERAL_PRODUCT_GROUP_ID, orders);
    const mappedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      productCount: group.productCount,
      status: group.archivedAt || !group.active ? ('Pausado' as const) : ('Activo' as const),
      description: group.description ?? 'Sin descripcion registrada.',
      isActive: group.id === this.filtersState().productGroupId,
      lastUpdated: group.updatedAt,
      metrics: this.createGroupMetrics(group.id, orders),
    }));

    return [
      {
        id: GENERAL_PRODUCT_GROUP_ID,
        name: 'Vista general',
        productCount: groups.reduce((total, group) => total + group.productCount, 0),
        status: 'Activo',
        description: 'Resumen consolidado de la operacion.',
        isActive: this.filtersState().productGroupId === GENERAL_PRODUCT_GROUP_ID,
        lastUpdated: new Date().toISOString(),
        metrics: generalMetrics,
      },
      ...mappedGroups,
    ];
  }

  private createGroupMetrics(
    groupId: string,
    orders: readonly Order[],
  ): readonly DashboardMetric[] {
    const groupOrders =
      groupId === GENERAL_PRODUCT_GROUP_ID
        ? orders
        : orders.filter((order) => order.productGroupId === groupId);
    const stats = this.createOrderStatistics(groupOrders);

    return [
      metric('orders', 'Ordenes', stats.totalOrders, 'Pedidos', 'receipt_long', 'number'),
      metric('sales', 'Ventas', stats.sales, 'Valor vendido', 'payments', 'currency'),
      metric('delivered', 'Entregas', stats.delivered, 'Completadas', 'local_shipping', 'number'),
    ];
  }

  private createOrderStatistics(orders: readonly Order[]): OrderStatistics {
    const sales = orders.reduce((total, order) => total + order.total, 0);
    const soldValue = orders
      .filter((order) => order.paymentStatus === 'Paid')
      .reduce((total, order) => total + order.total, 0);

    return {
      totalOrders: orders.length,
      sales,
      averageTicket: orders.length === 0 ? 0 : sales / orders.length,
      cancelled: orders.filter((order) => order.orderStatus === 'Cancelled').length,
      delivered: orders.filter(
        (order) => order.orderStatus === 'Delivered' || order.deliveryStatus === 'Delivered',
      ).length,
      inTransit: orders.filter(
        (order) => order.orderStatus === 'Shipped' || order.deliveryStatus === 'In Transit',
      ).length,
      urgent: orders.filter((order) => order.urgent).length,
      soldValue,
      pendingValue: Math.max(sales - soldValue, 0),
    };
  }

  private buildLoadNotice(data: {
    readonly orders: unknown;
    readonly orderStatistics: unknown;
    readonly productGroups: unknown;
    readonly productGroupStatistics: unknown;
    readonly tagStatistics: unknown;
    readonly fileStatistics: unknown;
    readonly testingStatistics: unknown;
  }): string | null {
    const failedModules = [
      ['ordenes', data.orders || data.orderStatistics],
      ['conjuntos', data.productGroups || data.productGroupStatistics],
      ['etiquetas', data.tagStatistics],
      ['archivos', data.fileStatistics],
      ['testeos', data.testingStatistics],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (failedModules.length === 0) return 'Dashboard actualizado.';
    if (failedModules.length >= 4) {
      return 'Dashboard cargado parcialmente. Revisa backend, sesion o permisos.';
    }

    return `Dashboard cargado parcialmente: faltan ${failedModules.join(', ')}.`;
  }

  private resolveStatus(source: unknown): MetricStatus {
    return source === null || source === undefined ? 'unavailable' : 'default';
  }

  private createProductGroupId(name: string): string {
    const baseId = name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const existingIds = new Set(this.productGroupsState().map((productGroup) => productGroup.id));

    if (!existingIds.has(baseId)) return baseId;

    let suffix = 2;
    let nextId = `${baseId}-${suffix}`;

    while (existingIds.has(nextId)) {
      suffix += 1;
      nextId = `${baseId}-${suffix}`;
    }

    return nextId;
  }
}

function metric(
  id: string,
  title: string,
  value: number,
  subtitle: string,
  icon: string,
  format: MetricFormat,
  status: MetricStatus = 'default',
  footer: string | null = null,
): DashboardMetric {
  return {
    id,
    title,
    value,
    formattedValue: formatValue(value, format),
    subtitle,
    icon,
    trendValue: null,
    trendDirection: 'neutral',
    status,
    format,
    tooltip: null,
    footer,
  };
}

function formatValue(value: number, format: MetricFormat): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (format === 'percentage') return formatPercentage(value);
  if (format === 'multiplier') return `${value.toFixed(2)}x`;

  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
}

function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value)} %`;
}

function formatBytes(value: number): string {
  if (value <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** exponent;

  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(amount)} ${units[exponent]}`;
}

function resolveDateRange(filters: DashboardFilter): Pick<DashboardFilter, 'dateFrom' | 'dateTo'> {
  if (filters.dateFrom || filters.dateTo) {
    return { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
  }

  const today = new Date();
  const end = toDateInput(today);
  const start = new Date(today);

  if (filters.period === 'last-7-days') start.setDate(today.getDate() - 6);
  if (filters.period === 'last-30-days') start.setDate(today.getDate() - 29);
  if (filters.period === 'this-month') start.setDate(1);

  return {
    dateFrom: toDateInput(start),
    dateTo: end,
  };
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createGeneralProductGroup(): ProductGroup {
  return {
    id: GENERAL_PRODUCT_GROUP_ID,
    name: 'Vista general',
    productCount: 0,
    status: 'Activo',
    description: 'Resumen consolidado de la operacion.',
    isActive: true,
    lastUpdated: new Date().toISOString(),
    metrics: [],
  };
}
