import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { DailyOrder, OrderStatus } from '../../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../../daily-report/services/imported-orders-store.service';

type MetricTone = 'blue' | 'green' | 'teal' | 'amber' | 'red';
type UrgentFilter = 'all' | 'yes' | 'no';

interface DonutMetric {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly percentage: number;
  readonly tone: MetricTone;
}

interface GuideSegment {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly color: string;
  readonly enabled: boolean;
}

interface GuidePreference {
  readonly id: string;
  readonly color: string;
  readonly enabled: boolean;
}

interface SummaryMetric {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly percentage: number;
  readonly tone: MetricTone;
}

interface ProductGroupRow {
  readonly name: string;
  readonly products: number;
  readonly orders: number;
  readonly sales: string;
  readonly deliveryRate: string;
  readonly roas: string;
  readonly cpa: string;
  readonly profit: string;
  readonly salesPercentage: number;
  readonly profitPercentage: number;
  readonly tone: 'strong' | 'stable' | 'attention';
}

interface StatusRow {
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
  readonly percentageLabel: string;
  readonly icon: string;
  readonly color: string;
}

interface OrderRow {
  readonly order: string;
  readonly dateIso: string;
  readonly dateLabel: string;
  readonly guide: string;
  readonly status: string;
  readonly guideStatus: string;
  readonly customer: string;
  readonly product: string;
  readonly group: string;
  readonly city: string;
  readonly carrier: string;
  readonly value: string;
  readonly profit: string;
  readonly valueAmount: number;
  readonly profitAmount: number;
  readonly costAmount: number;
  readonly urgent: boolean;
}

interface DashboardTotals {
  readonly total: number;
  readonly confirmed: number;
  readonly delivered: number;
  readonly sales: number;
  readonly profit: number;
  readonly costs: number;
  readonly returns: number;
  readonly cancelled: number;
  readonly urgent: number;
  readonly deliveryRate: number;
  readonly marginRate: number;
  readonly roas: number;
  readonly cpa: number;
}

const GUIDE_STORAGE_KEY = 'linkoba.dashboard.guideSegments';
const FALLBACK_GUIDE_SEGMENT: GuideSegment = {
  id: 'sin-datos',
  label: 'Sin estados',
  count: 0,
  color: '#64748b',
  enabled: true,
};

const GUIDE_STATUS_ORDER = [
  'guia-generada',
  'recogida',
  'en-ruta',
  'entregada',
  'novedad',
  'devuelta',
  'cancelada',
  'preparado-para-transportadora',
  'en-procesamiento',
  'en-bodega',
  'en-reparto',
] as const;

const GUIDE_STATUS_COLORS: Record<string, string> = {
  'guia-generada': '#3b82f6',
  recogida: '#06b6d4',
  'en-ruta': '#8b5cf6',
  entregada: '#10b981',
  novedad: '#ef4444',
  devuelta: '#f97316',
  cancelada: '#d99009',
  'preparado-para-transportadora': '#eab308',
  'en-procesamiento': '#a855f7',
  'en-bodega': '#14b8a6',
  'en-reparto': '#38bdf8',
  despachada: '#22c55e',
  pendiente: '#f59e0b',
  'pendiente-confirmacion': '#f59e0b',
  'sin-estado': '#64748b',
};

const GUIDE_COLOR_PALETTE = [
  '#3b82f6',
  '#06b6d4',
  '#8b5cf6',
  '#10b981',
  '#ef4444',
  '#f97316',
  '#d99009',
  '#14b8a6',
  '#eab308',
  '#a855f7',
] as const;

const LEGACY_GUIDE_IDS_BY_LABEL = new Map<string, string>([
  ['guia-generada', 'generated'],
  ['recogida', 'picked'],
  ['en-ruta', 'route'],
  ['entregada', 'delivered'],
  ['novedad', 'issue'],
  ['devuelta', 'returned'],
  ['cancelada', 'cancelled'],
]);

const STATUS_CONFIG: readonly { label: OrderStatus; icon: string; color: string }[] = [
  { label: 'Pendiente', icon: 'schedule', color: '#3b82f6' },
  { label: 'Confirmada', icon: 'task_alt', color: '#10b981' },
  { label: 'En preparación', icon: 'inventory_2', color: '#14b8a6' },
  { label: 'Despachada', icon: 'local_shipping', color: '#06b6d4' },
  { label: 'En tránsito', icon: 'route', color: '#8b5cf6' },
  { label: 'Entregada', icon: 'verified', color: '#10b981' },
  { label: 'Devuelta', icon: 'assignment_return', color: '#ef4444' },
  { label: 'Cancelada', icon: 'block', color: '#f59e0b' },
];

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);

  readonly filtersVisible = signal(false);
  readonly guideEditorVisible = signal(false);
  readonly searchTerm = signal('');
  readonly groupFilter = signal('all');
  readonly carrierFilter = signal('all');
  readonly cityFilter = signal('all');
  readonly guideStatusFilter = signal('all');
  readonly urgentFilter = signal<UrgentFilter>('all');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly guidePreferences = signal<readonly GuidePreference[]>(loadGuidePreferences());
  readonly selectedGuideSegmentId = signal(FALLBACK_GUIDE_SEGMENT.id);
  readonly hoveredGuideSegmentId = signal<string | null>(null);
  readonly donutRadius = 45;
  readonly donutCircumference = 2 * Math.PI * this.donutRadius;

  readonly orders = computed<readonly OrderRow[]>(() =>
    this.importedOrdersStore
      .orders()
      .map((dailyOrder) => toOrderRow(dailyOrder))
      .sort((first, second) => second.dateIso.localeCompare(first.dateIso)),
  );

  readonly groupOptions = computed(() => unique(this.orders().map((row) => row.group)));
  readonly carrierOptions = computed(() => unique(this.orders().map((row) => row.carrier)));
  readonly cityOptions = computed(() => unique(this.orders().map((row) => row.city)));
  readonly guideStatusOptions = computed(() => unique(this.orders().map((row) => row.guideStatus)));
  readonly latestOrderDate = computed(
    () =>
      [...this.orders()].sort((a, b) => a.dateIso.localeCompare(b.dateIso)).at(-1)?.dateIso ??
      toDateIso(new Date()),
  );

  readonly filteredOrders = computed(() => {
    const search = normalize(this.searchTerm());
    const groupName = this.groupFilter();
    const carrier = this.carrierFilter();
    const city = this.cityFilter();
    const guideStatus = this.guideStatusFilter();
    const urgent = this.urgentFilter();
    const dateFrom = this.dateFromFilter();
    const dateTo = this.dateToFilter();

    return this.orders().filter((row) => {
      const haystack = normalize(
        `${row.order} ${row.dateLabel} ${row.guide} ${row.status} ${row.guideStatus} ${row.customer} ${row.product} ${row.group} ${row.city} ${row.carrier}`,
      );

      return (
        (!search || haystack.includes(search)) &&
        (!dateFrom || row.dateIso >= dateFrom) &&
        (!dateTo || row.dateIso <= dateTo) &&
        (groupName === 'all' || row.group === groupName) &&
        (carrier === 'all' || row.carrier === carrier) &&
        (city === 'all' || row.city === city) &&
        (guideStatus === 'all' || row.guideStatus === guideStatus) &&
        (urgent === 'all' || row.urgent === (urgent === 'yes'))
      );
    });
  });

  readonly totals = computed<DashboardTotals>(() => buildTotals(this.filteredOrders()));

  readonly standardDonutMetrics = computed<readonly DonutMetric[]>(() => {
    const totals = this.totals();

    return [
      {
        id: 'confirmed',
        label: 'Órdenes confirmadas',
        value: formatNumber(totals.confirmed),
        helper: `${formatNumber(totals.confirmed)} de ${formatNumber(totals.total)} órdenes`,
        percentage: totals.total > 0 ? (totals.confirmed / totals.total) * 100 : 0,
        tone: 'green',
      },
      {
        id: 'deliveries',
        label: 'Entregas',
        value: formatNumber(totals.delivered),
        helper: `${formatNumber(totals.delivered)} de ${formatNumber(totals.confirmed)} confirmadas`,
        percentage: totals.deliveryRate,
        tone: 'teal',
      },
    ];
  });

  readonly marginDonutMetric = computed<DonutMetric>(() => {
    const totals = this.totals();

    return {
      id: 'profit',
      label: 'Margen estimado',
      value: formatCompactCurrency(totals.profit),
      helper: `${formatPercent(totals.marginRate)} % sobre ventas`,
      percentage: totals.marginRate,
      tone: 'amber',
    };
  });

  readonly guideSegments = computed<readonly GuideSegment[]>(() =>
    buildGuideSegments(this.filteredOrders(), this.guidePreferences()),
  );

  readonly visibleGuideSegments = computed(() =>
    this.guideSegments().filter((segment) => segment.enabled),
  );

  readonly allGuideTotal = computed(() =>
    this.guideSegments().reduce((total, segment) => total + segment.count, 0),
  );

  readonly guideTotal = computed(() =>
    this.visibleGuideSegments().reduce((total, segment) => total + segment.count, 0),
  );

  readonly guideSummaryText = computed(() => {
    const segments = this.visibleGuideSegments();

    return segments.length > 0
      ? segments.map((segment) => `${segment.label} ${this.segmentShare(segment)}`).join(', ')
      : 'Sin estados de guía visibles';
  });

  readonly hoveredGuideSegment = computed(() => {
    const hoveredId = this.hoveredGuideSegmentId();
    return hoveredId
      ? (this.visibleGuideSegments().find((segment) => segment.id === hoveredId) ?? null)
      : null;
  });

  readonly selectedGuideSegment = computed<GuideSegment>(() => {
    const selectedId = this.selectedGuideSegmentId();

    return (
      this.guideSegments().find((segment) => segment.id === selectedId) ??
      this.guideSegments()[0] ??
      FALLBACK_GUIDE_SEGMENT
    );
  });

  readonly summaryMetrics = computed<readonly SummaryMetric[]>(() => {
    const totals = this.totals();

    return [
      card(
        'orders',
        'Órdenes recibidas',
        formatNumber(totals.total),
        'Órdenes filtradas',
        'receipt_long',
        100,
        'blue',
      ),
      card(
        'confirmed',
        'Órdenes confirmadas',
        formatNumber(totals.confirmed),
        'Validación comercial',
        'fact_check',
        ratioPercent(totals.confirmed, totals.total),
        'green',
      ),
      card(
        'sales',
        'Ventas totales',
        formatCurrency(totals.sales),
        'Recaudo filtrado',
        'payments',
        100,
        'teal',
      ),
      card(
        'deliveries',
        'Entregas',
        formatNumber(totals.delivered),
        'Paquetes entregados',
        'local_shipping',
        totals.deliveryRate,
        'green',
      ),
      card(
        'delivery-rate',
        'Tasa de entrega',
        `${formatPercent(totals.deliveryRate)} %`,
        'Efectividad operativa',
        'percent',
        totals.deliveryRate,
        'blue',
      ),
      card(
        'profit',
        'Ganancia estimada',
        formatCurrency(totals.profit),
        'Después de costos',
        'wallet',
        totals.marginRate,
        'green',
      ),
      card(
        'costs',
        'Costos operativos',
        formatCurrency(totals.costs),
        'Costo estimado',
        'campaign',
        ratioPercent(totals.costs, totals.sales),
        'blue',
      ),
      card(
        'roas',
        'ROAS',
        formatMultiplier(totals.roas),
        'Ventas / costos',
        'query_stats',
        100,
        'teal',
      ),
      card(
        'cpa',
        'CPA',
        formatCurrency(totals.cpa),
        'Costo por adquisición',
        'ads_click',
        clamp(ratioPercent(totals.cpa, 30_000), 0, 100),
        'red',
      ),
      card(
        'returns',
        'Devoluciones',
        formatNumber(totals.returns),
        'Casos registrados',
        'assignment_return',
        ratioPercent(totals.returns, totals.total),
        'red',
      ),
      card(
        'cancelled',
        'Cancelaciones',
        formatNumber(totals.cancelled),
        'Órdenes canceladas',
        'cancel',
        ratioPercent(totals.cancelled, totals.total),
        'amber',
      ),
      card(
        'urgent',
        'Órdenes urgentes',
        formatNumber(totals.urgent),
        'Requieren atención',
        'priority_high',
        ratioPercent(totals.urgent, totals.total),
        'amber',
      ),
    ];
  });

  readonly productGroups = computed<readonly ProductGroupRow[]>(() =>
    buildProductGroups(this.filteredOrders()),
  );
  readonly statusRows = computed<readonly StatusRow[]>(() => buildStatusRows(this.filteredOrders()));

  readonly activeFilterCount = computed(() => {
    const filters = [
      this.searchTerm().trim(),
      this.groupFilter() !== 'all',
      this.carrierFilter() !== 'all',
      this.cityFilter() !== 'all',
      this.guideStatusFilter() !== 'all',
      this.urgentFilter() !== 'all',
      this.dateFromFilter(),
      this.dateToFilter(),
    ];

    return filters.filter(Boolean).length;
  });

  readonly filteredRevenue = computed(() =>
    formatCurrency(this.filteredOrders().reduce((total, row) => total + row.valueAmount, 0)),
  );

  readonly filteredProfit = computed(() =>
    formatCurrency(this.filteredOrders().reduce((total, row) => total + row.profitAmount, 0)),
  );

  toggleFilters(): void {
    this.filtersVisible.update((visible) => !visible);
  }

  toggleGuideEditor(): void {
    const segments = this.guideSegments();
    if (segments.length === 0) {
      return;
    }

    if (!segments.some((segment) => segment.id === this.selectedGuideSegmentId())) {
      this.selectedGuideSegmentId.set(segments[0].id);
    }

    this.guideEditorVisible.update((visible) => !visible);
  }

  closeGuideEditor(): void {
    this.guideEditorVisible.set(false);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.groupFilter.set('all');
    this.carrierFilter.set('all');
    this.cityFilter.set('all');
    this.guideStatusFilter.set('all');
    this.urgentFilter.set('all');
    this.dateFromFilter.set('');
    this.dateToFilter.set('');
  }

  setDateRangeToday(): void {
    const latestDate = this.latestOrderDate();
    this.dateFromFilter.set(latestDate);
    this.dateToFilter.set(latestDate);
  }

  setDateRangeYesterday(): void {
    const latestDate = parseDateIso(this.latestOrderDate());
    const yesterday = toDateIso(addDays(latestDate, -1));
    this.dateFromFilter.set(yesterday);
    this.dateToFilter.set(yesterday);
  }

  setDateRangeLastSevenDays(): void {
    const latestDate = parseDateIso(this.latestOrderDate());
    this.dateFromFilter.set(toDateIso(addDays(latestDate, -6)));
    this.dateToFilter.set(toDateIso(latestDate));
  }

  setDateRangeCurrentMonth(): void {
    const latestDate = parseDateIso(this.latestOrderDate());
    this.dateFromFilter.set(`${latestDate.getFullYear()}-${pad2(latestDate.getMonth() + 1)}-01`);
    this.dateToFilter.set(toDateIso(latestDate));
  }

  updateGuideColor(segmentId: string, value: string): void {
    const color = isHexColor(value) ? value : '#3b82f6';
    this.updateGuideSegment(segmentId, (segment) => ({ ...segment, color }));
  }

  toggleGuideSegmentVisibility(segmentId: string, visible: boolean): void {
    const segmentExists = this.guideSegments().some((segment) => segment.id === segmentId);
    if (!segmentExists || (!visible && this.visibleGuideSegments().length <= 1)) {
      return;
    }

    this.updateGuideSegment(segmentId, (segment) => ({ ...segment, enabled: visible }));
    if (!visible && this.hoveredGuideSegmentId() === segmentId) {
      this.hoveredGuideSegmentId.set(null);
    }
  }

  selectGuideSegment(segmentId: string): void {
    if (this.guideSegments().some((segment) => segment.id === segmentId)) {
      this.selectedGuideSegmentId.set(segmentId);
    }
  }

  updateSelectedGuideColor(value: string): void {
    const selected = this.selectedGuideSegment();
    if (this.guideSegments().some((segment) => segment.id === selected.id)) {
      this.updateGuideColor(selected.id, value);
    }
  }

  toggleSelectedGuideSegmentVisibility(visible: boolean): void {
    const selected = this.selectedGuideSegment();
    if (this.guideSegments().some((segment) => segment.id === selected.id)) {
      this.toggleGuideSegmentVisibility(selected.id, visible);
    }
  }

  setHoveredGuideSegment(segmentId: string | null): void {
    this.hoveredGuideSegmentId.set(segmentId);
  }

  resetGuideSegments(): void {
    const segments = this.guideSegments();
    const preferences = segments.map((segment, index) => ({
      id: segment.id,
      color: defaultGuideColor(segment.label, index),
      enabled: true,
    }));

    this.setGuidePreferences(preferences);
    this.selectedGuideSegmentId.set(preferences[0]?.id ?? FALLBACK_GUIDE_SEGMENT.id);
  }

  guideBackground(): string {
    const total = Math.max(this.guideTotal(), 1);
    let current = 0;
    const segments = this.visibleGuideSegments().map((segment) => {
      const start = current;
      current += (segment.count / total) * 360;
      return `${segment.color} ${start}deg ${current}deg`;
    });

    return segments.length > 0
      ? `conic-gradient(${segments.join(', ')})`
      : 'conic-gradient(rgb(255 255 255 / 8%) 0deg 360deg)';
  }

  guideStatusColor(label: string): string {
    return (
      this.guideSegments().find((segment) => segment.label === label)?.color ??
      defaultGuideColor(label, 0)
    );
  }

  donutSegmentDash(percentage: number): string {
    const segmentLength = (clamp(percentage, 0, 100) / 100) * this.donutCircumference;
    return `${segmentLength} ${this.donutCircumference}`;
  }

  guideSegmentDash(segment: GuideSegment): string {
    const total = Math.max(this.guideTotal(), 1);
    const visibleCount = Math.max(segment.count, 0);
    const segmentLength = (visibleCount / total) * this.donutCircumference;
    const visualLength =
      this.visibleGuideSegments().length > 1 ? Math.max(segmentLength - 2, 0) : segmentLength;

    return `${visualLength} ${this.donutCircumference}`;
  }

  guideSegmentOffset(segment: GuideSegment): number {
    const total = Math.max(this.guideTotal(), 1);
    let offset = 0;

    for (const current of this.visibleGuideSegments()) {
      if (current.id === segment.id) {
        break;
      }

      offset += (current.count / total) * this.donutCircumference;
    }

    return -offset;
  }

  segmentShare(segment: GuideSegment): string {
    const total = Math.max(this.guideTotal(), 1);
    return `${formatPercent((segment.count / total) * 100)} %`;
  }

  toneColor(tone: MetricTone): string {
    return toneColor(tone);
  }

  groupAccent(tone: ProductGroupRow['tone']): string {
    const colors: Record<ProductGroupRow['tone'], string> = {
      attention: '#d99009',
      stable: '#14b8a6',
      strong: '#10b981',
    };

    return colors[tone];
  }

  private updateGuideSegment(
    segmentId: string,
    updater: (segment: GuideSegment) => GuideSegment,
  ): void {
    const currentSegment = this.guideSegments().find((segment) => segment.id === segmentId);
    if (!currentSegment) {
      return;
    }

    const updatedSegment = updater(currentSegment);
    const preferences = new Map(
      this.guidePreferences().map((preference) => [preference.id, preference] as const),
    );
    preferences.set(segmentId, {
      id: segmentId,
      color: updatedSegment.color,
      enabled: updatedSegment.enabled,
    });

    this.setGuidePreferences(Array.from(preferences.values()));
  }

  private setGuidePreferences(preferences: readonly GuidePreference[]): void {
    this.guidePreferences.set(preferences);
    saveGuidePreferences(preferences);
  }
}

function card(
  id: string,
  title: string,
  value: string,
  subtitle: string,
  icon: string,
  percentage: number,
  tone: MetricTone,
): SummaryMetric {
  return { id, title, value, subtitle, icon, percentage: clamp(percentage, 0, 100), tone };
}

function toOrderRow(dailyOrder: DailyOrder): OrderRow {
  const dateIso = toDateIsoFromValue(dailyOrder.createdAt);
  const guideStatus = normalizeGuideStatusLabel(dailyOrder.guideStatus, dailyOrder.status);
  const costAmount = readOrderCost(dailyOrder);

  return {
    order: dailyOrder.orderNumber,
    dateIso,
    dateLabel: formatDateLabel(dateIso),
    guide: dailyOrder.guideNumber?.trim() || 'Sin guía',
    status: dailyOrder.status,
    guideStatus,
    customer: dailyOrder.customerName || 'Cliente sin nombre',
    product: dailyOrder.productName || 'Producto sin nombre',
    group: dailyOrder.productGroupName || 'Sin conjunto',
    city: dailyOrder.city || 'Sin ciudad',
    carrier: dailyOrder.carrier || 'Sin transportadora',
    value: formatCurrency(dailyOrder.orderValue),
    profit: formatCurrency(dailyOrder.estimatedProfit),
    valueAmount: dailyOrder.orderValue,
    profitAmount: dailyOrder.estimatedProfit,
    costAmount,
    urgent: dailyOrder.urgent,
  };
}

function buildTotals(orders: readonly OrderRow[]): DashboardTotals {
  const total = orders.length;
  const confirmed = orders.filter((orderRow) => isConfirmedOrder(orderRow.status)).length;
  const delivered = orders.filter((orderRow) => isDeliveredOrder(orderRow)).length;
  const sales = orders.reduce((sum, orderRow) => sum + orderRow.valueAmount, 0);
  const profit = orders.reduce((sum, orderRow) => sum + orderRow.profitAmount, 0);
  const costs = orders.reduce((sum, orderRow) => sum + orderRow.costAmount, 0);
  const returns = orders.filter((orderRow) => orderRow.status === 'Devuelta').length;
  const cancelled = orders.filter((orderRow) => orderRow.status === 'Cancelada').length;
  const urgent = orders.filter((orderRow) => orderRow.urgent).length;

  return {
    total,
    confirmed,
    delivered,
    sales,
    profit,
    costs,
    returns,
    cancelled,
    urgent,
    deliveryRate: ratioPercent(delivered, confirmed),
    marginRate: ratioPercent(profit, sales),
    roas: costs > 0 ? sales / costs : 0,
    cpa: confirmed > 0 ? costs / confirmed : 0,
  };
}

function buildGuideSegments(
  orders: readonly OrderRow[],
  preferences: readonly GuidePreference[],
): readonly GuideSegment[] {
  const counts = new Map<string, { label: string; count: number; firstIndex: number }>();

  orders.forEach((orderRow, index) => {
    const label = orderRow.guideStatus || 'Sin estado';
    const id = guideSegmentId(label);
    const current = counts.get(id);
    counts.set(id, {
      label,
      count: (current?.count ?? 0) + 1,
      firstIndex: current?.firstIndex ?? index,
    });
  });

  const preferenceById = new Map(preferences.map((preference) => [preference.id, preference]));

  return Array.from(counts.entries())
    .sort(([firstId, first], [secondId, second]) => {
      const firstOrder = guideStatusSortIndex(firstId);
      const secondOrder = guideStatusSortIndex(secondId);
      return firstOrder === secondOrder
        ? first.firstIndex - second.firstIndex
        : firstOrder - secondOrder;
    })
    .map(([id, item], index) => {
      const legacyPreference = preferenceById.get(LEGACY_GUIDE_IDS_BY_LABEL.get(id) ?? '');
      const preference = preferenceById.get(id) ?? legacyPreference;

      return {
        id,
        label: item.label,
        count: item.count,
        color: isHexColor(preference?.color)
          ? preference.color
          : defaultGuideColor(item.label, index),
        enabled: typeof preference?.enabled === 'boolean' ? preference.enabled : true,
      };
    });
}

function buildProductGroups(orders: readonly OrderRow[]): readonly ProductGroupRow[] {
  const byGroup = new Map<
    string,
    {
      products: Set<string>;
      orders: number;
      delivered: number;
      sales: number;
      profit: number;
      costs: number;
    }
  >();

  orders.forEach((orderRow) => {
    const item =
      byGroup.get(orderRow.group) ??
      {
        products: new Set<string>(),
        orders: 0,
        delivered: 0,
        sales: 0,
        profit: 0,
        costs: 0,
      };

    item.products.add(orderRow.product);
    item.orders += 1;
    item.delivered += isDeliveredOrder(orderRow) ? 1 : 0;
    item.sales += orderRow.valueAmount;
    item.profit += orderRow.profitAmount;
    item.costs += orderRow.costAmount;
    byGroup.set(orderRow.group, item);
  });

  const groups = Array.from(byGroup.entries()).sort(
    (first, second) => second[1].sales - first[1].sales,
  );
  const maxSales = Math.max(...groups.map(([, item]) => item.sales), 1);
  const maxProfit = Math.max(...groups.map(([, item]) => item.profit), 1);

  return groups.map(([name, item]) => {
    const deliveryRate = ratioPercent(item.delivered, item.orders);
    const roas = item.costs > 0 ? item.sales / item.costs : 0;
    const cpa = item.orders > 0 ? item.costs / item.orders : 0;

    return {
      name,
      products: item.products.size,
      orders: item.orders,
      sales: formatCompactCurrency(item.sales),
      deliveryRate: `${formatPercent(deliveryRate)}%`,
      roas: formatMultiplier(roas),
      cpa: formatCompactCurrency(cpa),
      profit: formatCompactCurrency(item.profit),
      salesPercentage: ratioPercent(item.sales, maxSales),
      profitPercentage: ratioPercent(item.profit, maxProfit),
      tone: groupTone(deliveryRate, item.profit),
    };
  });
}

function buildStatusRows(orders: readonly OrderRow[]): readonly StatusRow[] {
  const total = orders.length;

  return STATUS_CONFIG.map((config) => {
    const count = orders.filter((orderRow) => orderRow.status === config.label).length;
    const percentage = ratioPercent(count, total);

    return {
      label: config.label,
      count,
      percentage,
      percentageLabel: formatPercent(percentage),
      icon: config.icon,
      color: config.color,
    };
  });
}

function loadGuidePreferences(): GuidePreference[] {
  try {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const saved = JSON.parse(raw) as Partial<GuidePreference>[];
    if (!Array.isArray(saved)) {
      return [];
    }

    return saved
      .filter((preference) => typeof preference.id === 'string' && preference.id.trim().length > 0)
      .map((preference) => ({
        id: String(preference.id),
        color: isHexColor(preference.color) ? preference.color : '#3b82f6',
        enabled: typeof preference.enabled === 'boolean' ? preference.enabled : true,
      }));
  } catch {
    return [];
  }
}

function saveGuidePreferences(preferences: readonly GuidePreference[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(preferences));
    }
  } catch {
    // The dashboard still works when browser storage is unavailable.
  }
}

function readOrderCost(dailyOrder: DailyOrder): number {
  const knownCosts = [
    dailyOrder.shippingCost,
    dailyOrder.returnShippingCost,
    dailyOrder.commission,
    dailyOrder.providerCostTotal,
    dailyOrder.advertisingCost,
  ].reduce<number>((total, value) => total + safeNumber(value), 0);
  const derivedCost = Math.max(0, dailyOrder.orderValue - dailyOrder.estimatedProfit);

  return knownCosts > 0 ? knownCosts : derivedCost;
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
}

function isConfirmedOrder(status: string): boolean {
  return status !== 'Pendiente' && status !== 'Cancelada';
}

function isDeliveredOrder(orderRow: OrderRow): boolean {
  return (
    orderRow.status === 'Entregada' || normalizeForMatch(orderRow.guideStatus).includes('entregada')
  );
}

function normalizeGuideStatusLabel(value: string | undefined, fallbackStatus: OrderStatus): string {
  const source = value?.trim() || fallbackStatus || 'Sin estado';
  const normalized = normalizeForMatch(source);
  const aliases: readonly [readonly string[], string][] = [
    [['guia generada', 'guiagenerada'], 'Guía generada'],
    [['recogido por dropi', 'recogida'], 'Recogida'],
    [['preparado para transportadora'], 'Preparado para transportadora'],
    [['en procesamiento'], 'En procesamiento'],
    [['en bodega transportadora', 'en bodega origen', 'en bodega'], 'En bodega'],
    [['en reparto'], 'En reparto'],
    [['transito nacional', 'en transito', 'en ruta', 'intento de entrega'], 'En ruta'],
    [['entregado', 'entregada'], 'Entregada'],
    [['novedad'], 'Novedad'],
    [['devolucion', 'devuelta', 'rechazado', 'reclame en oficina'], 'Devuelta'],
    [['cancelado', 'cancelada'], 'Cancelada'],
    [['despachado', 'despachada'], 'Despachada'],
    [['pendiente confirmacion'], 'Pendiente confirmación'],
    [['pendiente'], 'Pendiente'],
  ];
  const match = aliases.find(([items]) => items.some((item) => normalized.includes(item)));

  return match?.[1] ?? toTitleCase(source.replace(/[_-]+/g, ' '));
}

function guideSegmentId(label: string): string {
  return (
    normalizeForMatch(label)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'sin-estado'
  );
}

function guideStatusSortIndex(id: string): number {
  const index = GUIDE_STATUS_ORDER.findIndex((item) => item === id);
  return index === -1 ? GUIDE_STATUS_ORDER.length : index;
}

function defaultGuideColor(label: string, index: number): string {
  return (
    GUIDE_STATUS_COLORS[guideSegmentId(label)] ??
    GUIDE_COLOR_PALETTE[index % GUIDE_COLOR_PALETTE.length]
  );
}

function groupTone(deliveryRate: number, profit: number): ProductGroupRow['tone'] {
  if (deliveryRate >= 75 && profit > 0) {
    return 'strong';
  }

  if (deliveryRate >= 55 && profit >= 0) {
    return 'stable';
  }

  return 'attention';
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeForMatch(value: string): string {
  return normalize(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000) {
    return `${sign}$${formatDecimal(absolute / 1_000_000)}M`;
  }

  if (absolute >= 1_000) {
    return `${sign}$${formatDecimal(absolute / 1_000)}K`;
  }

  return formatCurrency(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

function formatMultiplier(value: number): string {
  return `${new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: value > 0 && value < 10 ? 2 : 0,
  }).format(value)}x`;
}

function ratioPercent(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

function formatDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split('-');
  return `${day}/${month}/${year}`;
}

function toDateIsoFromValue(value: string): string {
  const dateMatch = /^\d{4}-\d{2}-\d{2}/.exec(value);
  if (dateMatch) {
    return dateMatch[0];
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? toDateIso(new Date()) : toDateIso(parsed);
}

function parseDateIso(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value);
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toneColor(tone: MetricTone): string {
  const colors: Record<MetricTone, string> = {
    amber: '#d99009',
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    teal: '#14b8a6',
  };

  return colors[tone];
}
