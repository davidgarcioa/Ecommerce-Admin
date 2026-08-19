import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

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
  readonly urgent: boolean;
}

const GUIDE_STORAGE_KEY = 'linkoba.dashboard.guideSegments';

const INITIAL_GUIDE_SEGMENTS: readonly GuideSegment[] = [
  { id: 'generated', label: 'Guía generada', count: 17, color: '#3b82f6', enabled: true },
  { id: 'picked', label: 'Recogida', count: 15, color: '#06b6d4', enabled: true },
  { id: 'route', label: 'En ruta', count: 38, color: '#8b5cf6', enabled: true },
  { id: 'delivered', label: 'Entregada', count: 136, color: '#10b981', enabled: true },
  { id: 'issue', label: 'Novedad', count: 13, color: '#ef4444', enabled: true },
  { id: 'returned', label: 'Devuelta', count: 12, color: '#f97316', enabled: true },
  { id: 'cancelled', label: 'Cancelada', count: 8, color: '#d99009', enabled: true },
];

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
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
  readonly guideSegments = signal<readonly GuideSegment[]>(loadGuideSegments());
  readonly selectedGuideSegmentId = signal(INITIAL_GUIDE_SEGMENTS[0].id);
  readonly hoveredGuideSegmentId = signal<string | null>(null);
  readonly donutRadius = 45;
  readonly donutCircumference = 2 * Math.PI * this.donutRadius;

  readonly standardDonutMetrics: readonly DonutMetric[] = [
    {
      id: 'confirmed',
      label: 'Órdenes confirmadas',
      value: '181',
      helper: '181 de 239 órdenes',
      percentage: 75.7,
      tone: 'green',
    },
    {
      id: 'deliveries',
      label: 'Entregas',
      value: '136',
      helper: '136 de 181 confirmadas',
      percentage: 75.1,
      tone: 'teal',
    },
  ];

  readonly marginDonutMetric: DonutMetric = {
    id: 'profit',
    label: 'Margen estimado',
    value: '$10,8M',
    helper: '52,9 % sobre ventas',
    percentage: 52.9,
    tone: 'amber',
  };

  readonly summaryMetrics: readonly SummaryMetric[] = [
    card('orders', 'Órdenes recibidas', '239', 'Órdenes filtradas', 'receipt_long', 100, 'blue'),
    card('confirmed', 'Órdenes confirmadas', '181', 'Validación comercial', 'fact_check', 75.7, 'green'),
    card('sales', 'Ventas totales', '$ 20.515.997', 'Recaudo filtrado', 'payments', 100, 'teal'),
    card('deliveries', 'Entregas', '136', 'Paquetes entregados', 'local_shipping', 75.1, 'green'),
    card('delivery-rate', 'Tasa de entrega', '75,1 %', 'Efectividad operativa', 'percent', 75.1, 'blue'),
    card('profit', 'Ganancia estimada', '$ 10.848.279', 'Después de costos', 'wallet', 52.9, 'green'),
    card('costs', 'Costos operativos', '$ 4.846.198', 'Flete y comisiones', 'campaign', 24, 'blue'),
    card('roas', 'ROAS', '4,23x', 'Ventas / costos', 'query_stats', 100, 'teal'),
    card('cpa', 'CPA', '$ 26.775', 'Costo por adquisición', 'ads_click', 88, 'red'),
    card('returns', 'Devoluciones', '43', 'Casos registrados', 'assignment_return', 18, 'red'),
    card('cancelled', 'Cancelaciones', '47', 'Órdenes canceladas', 'cancel', 20, 'amber'),
    card('urgent', 'Órdenes urgentes', '13', 'Requieren atención', 'priority_high', 6, 'amber'),
  ];

  readonly productGroups: readonly ProductGroupRow[] = [
    group('Fyntra 2', 18, 44, '$ 4.860.000', '81%', '4,72x', '$ 24.900', '$ 2.520.000', 100, 100, 'strong'),
    group('Helvor 2', 14, 39, '$ 4.210.000', '76%', '4,31x', '$ 25.800', '$ 2.110.000', 86, 84, 'strong'),
    group('Fondal', 11, 35, '$ 3.720.000', '71%', '3,98x', '$ 27.100', '$ 1.860.000', 76, 74, 'stable'),
    group('Gadrix 2', 9, 31, '$ 3.010.000', '68%', '3,54x', '$ 29.400', '$ 1.460.000', 62, 58, 'stable'),
    group('Halcor', 8, 28, '$ 2.610.000', '63%', '3,19x', '$ 31.900', '$ 1.220.000', 54, 48, 'attention'),
    group('Gemvia', 7, 22, '$ 2.104.997', '59%', '2,91x', '$ 34.300', '$ 918.279', 43, 36, 'attention'),
  ];

  readonly statusRows: readonly StatusRow[] = [
    status('Pendiente', 24, 10, 'schedule', '#3b82f6'),
    status('Confirmada', 45, 18.8, 'task_alt', '#10b981'),
    status('En preparación', 26, 10.9, 'inventory_2', '#14b8a6'),
    status('Despachada', 29, 12.1, 'local_shipping', '#06b6d4'),
    status('En tránsito', 31, 13, 'route', '#8b5cf6'),
    status('Entregada', 136, 56.9, 'verified', '#10b981'),
    status('Devuelta', 43, 18, 'assignment_return', '#ef4444'),
    status('Cancelada', 47, 19.7, 'block', '#f59e0b'),
  ];

  readonly orders: readonly OrderRow[] = [
    order('LK-0001', '2026-08-19', 'GUIA890001', 'Entregada', 'Entregada', 'Laura Méndez', 'Kit Skin Care Premium', 'Fyntra 2', 'Bogotá', 'Coordinadora', 189000, 91300, false),
    order('LK-0002', '2026-08-19', 'GUIA890002', 'En tránsito', 'En ruta', 'Carlos Rojas', 'Organizador Modular', 'Helvor 2', 'Medellín', 'Servientrega', 149000, 63700, false),
    order('LK-0003', '2026-08-18', 'GUIA890003', 'Confirmada', 'Guía generada', 'Natalia Pérez', 'Audífonos Pro', 'Fondal', 'Cali', 'Envía', 219000, 102900, true),
    order('LK-0004', '2026-08-17', 'GUIA890004', 'Despachada', 'Recogida', 'Andrés Soto', 'Set Cocina Práctica', 'Gadrix 2', 'Barranquilla', 'TCC', 176000, 78400, false),
    order('LK-0005', '2026-08-16', 'GUIA890005', 'Devuelta', 'Novedad', 'Camila Torres', 'Corrector Postural', 'Halcor', 'Bucaramanga', 'Inter Rapidísimo', 132000, 34100, true),
    order('LK-0006', '2026-08-15', 'GUIA890006', 'Cancelada', 'Cancelada', 'Felipe Gómez', 'Lámpara LED Smart', 'Gemvia', 'Pereira', 'Coordinadora', 158000, 0, false),
  ];

  readonly groupOptions = computed(() => unique(this.orders.map((row) => row.group)));
  readonly carrierOptions = computed(() => unique(this.orders.map((row) => row.carrier)));
  readonly cityOptions = computed(() => unique(this.orders.map((row) => row.city)));
  readonly guideStatusOptions = computed(() => unique(this.orders.map((row) => row.guideStatus)));
  readonly latestOrderDate = computed(() => [...this.orders].sort((a, b) => a.dateIso.localeCompare(b.dateIso)).at(-1)?.dateIso ?? '');
  readonly visibleGuideSegments = computed(() => this.guideSegments().filter((segment) => segment.enabled));
  readonly allGuideTotal = computed(() =>
    this.guideSegments().reduce((total, segment) => total + segment.count, 0),
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

    return this.orders.filter((row) => {
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

  readonly guideTotal = computed(() =>
    this.visibleGuideSegments().reduce((total, segment) => total + segment.count, 0),
  );

  readonly guideSummaryText = computed(() =>
    this.visibleGuideSegments().map((segment) => `${segment.label} ${this.segmentShare(segment)}`).join(', '),
  );

  readonly hoveredGuideSegment = computed(() => {
    const hoveredId = this.hoveredGuideSegmentId();
    return hoveredId
      ? this.visibleGuideSegments().find((segment) => segment.id === hoveredId) ?? null
      : null;
  });

  readonly selectedGuideSegment = computed<GuideSegment>(() => {
    const selectedId = this.selectedGuideSegmentId();
    return (
      this.guideSegments().find((segment) => segment.id === selectedId) ??
      this.guideSegments()[0] ??
      INITIAL_GUIDE_SEGMENTS[0]
    );
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

  updateGuideCount(segmentId: string, value: unknown): void {
    const count = Math.max(0, Math.round(Number(value) || 0));
    this.updateGuideSegment(segmentId, (segment) => ({ ...segment, count }));
  }

  updateGuideColor(segmentId: string, value: string): void {
    const color = isHexColor(value) ? value : '#3b82f6';
    this.updateGuideSegment(segmentId, (segment) => ({ ...segment, color }));
  }

  toggleGuideSegmentVisibility(segmentId: string, visible: boolean): void {
    if (!visible && this.visibleGuideSegments().length <= 1) {
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
    if (selected) {
      this.updateGuideColor(selected.id, value);
    }
  }

  toggleSelectedGuideSegmentVisibility(visible: boolean): void {
    this.toggleGuideSegmentVisibility(this.selectedGuideSegment().id, visible);
  }

  setHoveredGuideSegment(segmentId: string | null): void {
    this.hoveredGuideSegmentId.set(segmentId);
  }

  resetGuideSegments(): void {
    this.setGuideSegments(cloneInitialGuideSegments());
    this.selectedGuideSegmentId.set(INITIAL_GUIDE_SEGMENTS[0].id);
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
    return this.guideSegments().find((segment) => segment.label === label)?.color ?? '#3b82f6';
  }

  donutSegmentDash(percentage: number): string {
    const segmentLength = (clamp(percentage, 0, 100) / 100) * this.donutCircumference;
    return `${segmentLength} ${this.donutCircumference}`;
  }

  guideSegmentDash(segment: GuideSegment): string {
    const total = Math.max(this.guideTotal(), 1);
    const visibleCount = Math.max(segment.count, 0);
    const segmentLength = (visibleCount / total) * this.donutCircumference;
    const visualLength = this.visibleGuideSegments().length > 1 ? Math.max(segmentLength - 2, 0) : segmentLength;

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
    const next = this.guideSegments().map((segment) =>
      segment.id === segmentId ? updater(segment) : segment,
    );

    this.setGuideSegments(next);
  }

  private setGuideSegments(segments: readonly GuideSegment[]): void {
    this.guideSegments.set(segments);
    saveGuideSegments(segments);
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
  return { id, title, value, subtitle, icon, percentage, tone };
}

function group(
  name: string,
  products: number,
  orders: number,
  sales: string,
  deliveryRate: string,
  roas: string,
  cpa: string,
  profit: string,
  salesPercentage: number,
  profitPercentage: number,
  tone: ProductGroupRow['tone'],
): ProductGroupRow {
  return { name, products, orders, sales, deliveryRate, roas, cpa, profit, salesPercentage, profitPercentage, tone };
}

function status(label: string, count: number, percentage: number, icon: string, color: string): StatusRow {
  return { label, count, percentage, icon, color };
}

function order(
  orderNumber: string,
  dateIso: string,
  guide: string,
  rowStatus: string,
  guideStatus: string,
  customer: string,
  product: string,
  groupName: string,
  city: string,
  carrier: string,
  valueAmount: number,
  profitAmount: number,
  urgent: boolean,
): OrderRow {
  return {
    order: orderNumber,
    dateIso,
    dateLabel: formatDateLabel(dateIso),
    guide,
    status: rowStatus,
    guideStatus,
    customer,
    product,
    group: groupName,
    city,
    carrier,
    value: formatCurrency(valueAmount),
    profit: formatCurrency(profitAmount),
    valueAmount,
    profitAmount,
    urgent,
  };
}

function loadGuideSegments(): GuideSegment[] {
  try {
    if (typeof localStorage === 'undefined') {
      return cloneInitialGuideSegments();
    }

    const raw = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!raw) {
      return cloneInitialGuideSegments();
    }

    const saved = JSON.parse(raw) as Partial<GuideSegment>[];
    if (!Array.isArray(saved)) {
      return cloneInitialGuideSegments();
    }

    const savedById = new Map(saved.map((segment) => [segment.id, segment]));
    return INITIAL_GUIDE_SEGMENTS.map((base) => {
      const segment = savedById.get(base.id);
      return {
        ...base,
        count: Math.max(0, Math.round(Number(segment?.count ?? base.count) || 0)),
        color: isHexColor(segment?.color) ? segment.color : base.color,
        enabled: typeof segment?.enabled === 'boolean' ? segment.enabled : base.enabled,
      };
    });
  } catch {
    return cloneInitialGuideSegments();
  }
}

function saveGuideSegments(segments: readonly GuideSegment[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(segments));
    }
  } catch {
    // The dashboard still works when browser storage is unavailable.
  }
}

function cloneInitialGuideSegments(): GuideSegment[] {
  return INITIAL_GUIDE_SEGMENTS.map((segment) => ({ ...segment }));
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'es'));
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split('-');
  return `${day}/${month}/${year}`;
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
