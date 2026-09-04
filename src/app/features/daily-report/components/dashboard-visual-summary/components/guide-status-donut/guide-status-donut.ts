import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { accountScopedStorageKey } from '../../../../../../core/services/account-storage.service';
import { AnimateOnViewDirective } from '../../../../../../shared/directives/animate-on-view.directive';
import { DailyOrder } from '../../../../models/daily-order.model';
import { formatDailyValue } from '../../../../utils/daily-report.utils';
import {
  GuideStatusOption,
  GuideStatusPreferences,
  GuideStatusSegment,
} from '../../dashboard-visual-summary.models';
import { buildGuideDonutBackground } from '../../dashboard-visual-summary.utils';

const MAX_VISIBLE_GUIDE_STATUSES = 5;
const GUIDE_STATUS_PREFERENCES_KEY = 'ecommerce_dashboard_guide_status_preferences';

const GUIDE_STATUS_OPTIONS: readonly GuideStatusOption[] = [
  { id: 'created', label: 'Guía generada', count: 18 },
  { id: 'collected', label: 'Recogida', count: 14 },
  { id: 'warehouse', label: 'En bodega', count: 22 },
  { id: 'route', label: 'En ruta', count: 31 },
  { id: 'delivered', label: 'Entregada', count: 77 },
  { id: 'incident', label: 'Novedad', count: 9 },
  { id: 'returned', label: 'Devuelta', count: 11 },
  { id: 'cancelled', label: 'Cancelada', count: 6 },
];

const DEFAULT_SELECTED_GUIDE_STATUSES: readonly string[] = [
  'warehouse',
  'route',
  'delivered',
  'incident',
];

const DEFAULT_GUIDE_STATUS_COLORS: Readonly<Record<string, string>> = {
  cancelled: '#64748b',
  collected: '#06b6d4',
  created: '#3b82f6',
  delivered: '#10b981',
  incident: '#ef4444',
  returned: '#f97316',
  route: '#8b5cf6',
  warehouse: '#f59e0b',
};

const GUIDE_COLOR_PALETTE: readonly string[] = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#8b5cf6',
  '#f97316',
  '#64748b',
];

@Component({
  selector: 'app-guide-status-donut',
  imports: [AnimateOnViewDirective],
  templateUrl: './guide-status-donut.html',
  styleUrl: './guide-status-donut.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideStatusDonutComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly orders = input<readonly DailyOrder[]>([]);
  private readonly initialGuideStatusPreferences = loadGuideStatusPreferences();
  private animationFrameId: number | null = null;
  private previousBodyOverflow: string | null = null;
  readonly guideStatusPanelOpen = signal(false);
  readonly activeColorStatusId = signal<string | null>(null);
  readonly activeGuideStatusSegment = signal<GuideStatusSegment | null>(null);
  readonly animationProgress = signal(0);
  readonly hasEnteredView = signal(false);
  readonly selectedGuideStatusIds = signal<readonly string[]>(
    this.initialGuideStatusPreferences.selectedStatusIds,
  );
  readonly guideStatusColors = signal<Readonly<Record<string, string>>>(
    this.initialGuideStatusPreferences.statusColors,
  );
  readonly guideStatusOptions = computed<readonly GuideStatusOption[]>(() => {
    const groups = new Map<string, GuideStatusOption>();

    this.orders().forEach((order) => {
      const label = order.guideStatus?.trim();

      if (!label) {
        return;
      }

      const id = toStatusId(label);
      const existing = groups.get(id);
      groups.set(id, {
        id,
        label,
        count: (existing?.count ?? 0) + 1,
      });
    });

    if (groups.size === 0) {
      return GUIDE_STATUS_OPTIONS;
    }

    return Array.from(groups.values()).sort((first, second) => second.count - first.count);
  });

  constructor() {
    effect(() => {
      saveGuideStatusPreferences({
        selectedStatusIds: this.selectedGuideStatusIds(),
        statusColors: this.guideStatusColors(),
      });
    });

    effect(() => {
      this.statusSegments();

      if (this.hasEnteredView()) {
        this.animateDonut();
      } else {
        this.animationProgress.set(0);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.unlockPageScroll();
  }

  readonly statusSegments = computed<readonly GuideStatusSegment[]>(() => {
    const selectedIds = this.effectiveSelectedGuideStatusIds();
    const selectedStatuses = this.guideStatusOptions().filter((status) =>
      selectedIds.includes(status.id),
    );
    const total = selectedStatuses.reduce((sum, status) => sum + status.count, 0);

    return selectedStatuses.map((status) => {
      const percentage = total === 0 ? 0 : (status.count / total) * 100;

      return {
        ...status,
        color: this.guideStatusColor(status.id),
        percentage,
        tooltip: `${status.label}: ${formatDailyValue(percentage, 'percentage')}`,
      };
    });
  });

  readonly statusDonutBackground = computed(() =>
    buildGuideDonutBackground(
      this.hasEnteredView() ? this.animatedStatusSegments() : this.statusSegments(),
    ),
  );

  readonly leadingStatuses = this.statusSegments;
  readonly totalGuideStatuses = computed(() =>
    this.statusSegments().reduce((total, segment) => total + segment.count, 0),
  );

  readonly effectiveSelectedGuideStatusIds = computed<readonly string[]>(() => {
    const options = this.guideStatusOptions();
    const availableIds = new Set(options.map((option) => option.id));
    const selectedIds = this.selectedGuideStatusIds().filter((id) => availableIds.has(id));

    if (selectedIds.length > 0) {
      return selectedIds.slice(0, MAX_VISIBLE_GUIDE_STATUSES);
    }

    return options.slice(0, Math.min(4, MAX_VISIBLE_GUIDE_STATUSES)).map((option) => option.id);
  });

  readonly animatedStatusSegments = computed<readonly GuideStatusSegment[]>(() =>
    this.statusSegments().map((segment) => ({
      ...segment,
      percentage: segment.percentage * this.animationProgress(),
    })),
  );

  toggleGuideStatusPanel(): void {
    if (this.guideStatusPanelOpen()) {
      this.closeGuideStatusPanel();
      return;
    }

    this.ensureGuideStatusSelection();
    this.elementRef.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
    this.guideStatusPanelOpen.set(true);
    this.lockPageScroll();
  }

  setActiveGuideStatusSegment(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const normalizedAngle = ((Math.atan2(y, x) * 180) / Math.PI + 450) % 360;
    let currentAngle = 0;

    for (const segment of this.statusSegments()) {
      currentAngle += segment.percentage * 3.6;

      if (normalizedAngle <= currentAngle) {
        this.activeGuideStatusSegment.set(segment);
        return;
      }
    }

    this.activeGuideStatusSegment.set(null);
  }

  clearActiveGuideStatusSegment(): void {
    this.activeGuideStatusSegment.set(null);
  }

  closeGuideStatusPanel(): void {
    this.guideStatusPanelOpen.set(false);
    this.activeColorStatusId.set(null);
    this.unlockPageScroll();
  }

  onVisible(): void {
    this.hasEnteredView.set(true);
  }

  toggleGuideStatus(statusId: string): void {
    const currentColor = this.guideStatusColor(statusId);

    this.selectedGuideStatusIds.update((selectedIds) => {
      const exists = selectedIds.includes(statusId);

      if (exists) {
        return selectedIds.length === 1 ? selectedIds : selectedIds.filter((id) => id !== statusId);
      }

      if (selectedIds.length >= MAX_VISIBLE_GUIDE_STATUSES) {
        return selectedIds;
      }

      if (this.isColorUsedBySelectedStatus(currentColor, statusId)) {
        this.assignFirstAvailableColor(statusId);
      }

      return [...selectedIds, statusId];
    });
  }

  isGuideStatusSelected(statusId: string): boolean {
    return this.effectiveSelectedGuideStatusIds().includes(statusId);
  }

  isGuideStatusDisabled(statusId: string): boolean {
    return (
      !this.isGuideStatusSelected(statusId) &&
      this.effectiveSelectedGuideStatusIds().length >= MAX_VISIBLE_GUIDE_STATUSES
    );
  }

  guideStatusColor(statusId: string): string {
    return this.guideStatusColors()[statusId] ?? this.defaultGuideStatusColor(statusId);
  }

  updateGuideStatusColor(statusId: string, color: string): void {
    if (!this.availableGuideColors(statusId).includes(color)) {
      return;
    }

    this.guideStatusColors.update((colors) => ({ ...colors, [statusId]: color }));
    this.activeColorStatusId.set(null);
  }

  toggleColorPicker(statusId: string): void {
    this.activeColorStatusId.update((activeId) => (activeId === statusId ? null : statusId));
  }

  isColorPickerOpen(statusId: string): boolean {
    return this.activeColorStatusId() === statusId;
  }

  availableGuideColors(statusId: string): readonly string[] {
    return GUIDE_COLOR_PALETTE.filter(
      (color) =>
        this.guideStatusColor(statusId) === color ||
        !this.isColorUsedBySelectedStatus(color, statusId),
    );
  }

  private assignFirstAvailableColor(statusId: string): void {
    const availableColor = GUIDE_COLOR_PALETTE.find(
      (color) => !this.isColorUsedBySelectedStatus(color, statusId),
    );

    if (availableColor === undefined) {
      return;
    }

    this.guideStatusColors.update((colors) => ({ ...colors, [statusId]: availableColor }));
  }

  private isColorUsedBySelectedStatus(color: string, currentStatusId: string): boolean {
    return this.effectiveSelectedGuideStatusIds().some(
      (selectedId) => selectedId !== currentStatusId && this.guideStatusColor(selectedId) === color,
    );
  }

  private ensureGuideStatusSelection(): void {
    const availableIds = new Set(this.guideStatusOptions().map((option) => option.id));
    const selectedIds = this.selectedGuideStatusIds().filter((id) => availableIds.has(id));

    if (selectedIds.length === 0) {
      this.selectedGuideStatusIds.set(this.effectiveSelectedGuideStatusIds());
    }
  }

  private defaultGuideStatusColor(statusId: string): string {
    if (statusId.includes('bodega')) {
      return '#f59e0b';
    }
    if (statusId.includes('ruta') || statusId.includes('transito')) {
      return '#8b5cf6';
    }
    if (statusId.includes('entreg')) {
      return '#10b981';
    }
    if (statusId.includes('novedad')) {
      return '#ef4444';
    }
    if (statusId.includes('devol')) {
      return '#f97316';
    }
    if (statusId.includes('cancel')) {
      return '#64748b';
    }
    if (statusId.includes('recog')) {
      return '#06b6d4';
    }

    return '#3b82f6';
  }

  private animateDonut(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const duration = 850;
    const startedAt = performance.now();

    const tick = (time: number): void => {
      const progress = Math.min((time - startedAt) / duration, 1);
      this.animationProgress.set(easeOutCubic(progress));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    this.animationProgress.set(0);
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private lockPageScroll(): void {
    if (this.previousBodyOverflow !== null) {
      return;
    }

    this.previousBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
  }

  private unlockPageScroll(): void {
    if (this.previousBodyOverflow === null) {
      return;
    }

    this.document.body.style.overflow = this.previousBodyOverflow;
    this.previousBodyOverflow = null;
  }
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function toStatusId(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function loadGuideStatusPreferences(): GuideStatusPreferences {
  try {
    const rawPreferences = localStorage.getItem(
      accountScopedStorageKey(GUIDE_STATUS_PREFERENCES_KEY),
    );

    if (rawPreferences === null) {
      return createDefaultGuideStatusPreferences();
    }

    const parsedPreferences = JSON.parse(rawPreferences) as Partial<GuideStatusPreferences>;

    return {
      selectedStatusIds: normalizeSelectedStatusIds(parsedPreferences.selectedStatusIds),
      statusColors: normalizeGuideStatusColors(parsedPreferences.statusColors),
    };
  } catch {
    return createDefaultGuideStatusPreferences();
  }
}

function saveGuideStatusPreferences(preferences: GuideStatusPreferences): void {
  try {
    localStorage.setItem(
      accountScopedStorageKey(GUIDE_STATUS_PREFERENCES_KEY),
      JSON.stringify(preferences),
    );
  } catch {
    // Las preferencias son opcionales.
  }
}

function createDefaultGuideStatusPreferences(): GuideStatusPreferences {
  return {
    selectedStatusIds: DEFAULT_SELECTED_GUIDE_STATUSES,
    statusColors: DEFAULT_GUIDE_STATUS_COLORS,
  };
}

function normalizeSelectedStatusIds(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SELECTED_GUIDE_STATUSES;
  }

  const validIds = new Set(GUIDE_STATUS_OPTIONS.map((option) => option.id));
  const selectedIds = value
    .filter(
      (statusId): statusId is string => typeof statusId === 'string' && validIds.has(statusId),
    )
    .filter((statusId, index, statusIds) => statusIds.indexOf(statusId) === index)
    .slice(0, MAX_VISIBLE_GUIDE_STATUSES);

  return selectedIds.length === 0 ? DEFAULT_SELECTED_GUIDE_STATUSES : selectedIds;
}

function normalizeGuideStatusColors(value: unknown): Readonly<Record<string, string>> {
  const nextColors: Record<string, string> = { ...DEFAULT_GUIDE_STATUS_COLORS };

  if (!isGuideStatusColorRecord(value)) {
    return nextColors;
  }

  for (const option of GUIDE_STATUS_OPTIONS) {
    const color = value[option.id];

    if (typeof color === 'string' && GUIDE_COLOR_PALETTE.includes(color)) {
      nextColors[option.id] = color;
    }
  }

  return nextColors;
}

function isGuideStatusColorRecord(value: unknown): value is Readonly<Record<string, string>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
