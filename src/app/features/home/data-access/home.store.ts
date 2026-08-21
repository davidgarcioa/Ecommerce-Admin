import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { PermissionCode, PermissionsService } from '../../../core/services/permissions.service';
import { HOME_QUICK_ACCESS_ITEMS } from '../utils/home.constants';
import { formatHomeDate, getHomeGreeting } from '../utils/home-date.utils';
import { getDisplayName, getRoleLabel, readHomeUserFromToken } from '../utils/home-user.utils';
import { HomePreferencesService } from './home-preferences.service';
import { toHomeOverview } from './home.mapper';
import { HomeOverview, HomeUserSummary } from './home.models';
import { HomeApiService } from './home-api.service';

@Injectable()
export class HomeStore {
  private readonly api = inject(HomeApiService);
  private readonly permissions = inject(PermissionsService);
  private readonly preferences = inject(HomePreferencesService);

  private readonly userState = signal<HomeUserSummary | null>(readHomeUserFromToken());
  private readonly overviewState = signal<HomeOverview | null>(null);
  private readonly loadingState = signal(false);
  private readonly refreshingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly selectedQuickAccessItemIdsState = signal<readonly string[]>([]);

  readonly user = this.userState.asReadonly();
  readonly overview = this.overviewState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly refreshing = this.refreshingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly permissionsList = this.permissions.permissions;

  readonly userName = computed(() => getDisplayName(this.userState()));
  readonly userRoleLabel = computed(() => getRoleLabel(this.userState()));
  readonly greeting = computed(() => getHomeGreeting());
  readonly currentDate = computed(() => formatHomeDate());
  readonly lastUpdatedLabel = computed(() => {
    const loadedAt = this.overviewState()?.loadedAt;
    return loadedAt ? 'hace unos minutos' : null;
  });
  readonly availableQuickAccessItems = computed(() =>
    HOME_QUICK_ACCESS_ITEMS.filter((item) => this.permissions.hasAny(item.permissions)).sort(
      (first, second) => first.order - second.order,
    ),
  );
  readonly selectedQuickAccessItemIds = this.selectedQuickAccessItemIdsState.asReadonly();
  readonly visibleQuickAccessItems = computed(() => {
    const selectedIds = new Set(this.selectedQuickAccessItemIdsState());
    return this.availableQuickAccessItems().filter((item) => selectedIds.has(item.id));
  });
  readonly moduleSummaries = computed(() => this.overviewState()?.summaries ?? []);
  readonly pendingItems = computed(() => this.overviewState()?.pendingItems ?? []);
  readonly attentionItems = computed(() => this.overviewState()?.attentionItems ?? []);
  readonly visibleWorkItems = computed(() =>
    [...this.attentionItems(), ...this.pendingItems()].slice(0, 5),
  );
  readonly hasWorkItems = computed(() => this.visibleWorkItems().length > 0);
  readonly partialErrors = computed(() => this.overviewState()?.partialErrors ?? []);
  readonly totalPendingItems = computed(() =>
    this.pendingItems().reduce((total, item) => total + item.count, 0),
  );
  readonly totalAttentionItems = computed(() =>
    this.attentionItems().reduce((total, item) => total + item.count, 0),
  );
  readonly hasOverviewData = computed(
    () =>
      this.moduleSummaries().length > 0 ||
      this.pendingItems().length > 0 ||
      this.attentionItems().length > 0,
  );

  load(): void {
    this.userState.set(readHomeUserFromToken());
    this.restoreQuickAccessPreferences();

    if (this.permissionsList().length === 0) {
      this.errorState.set('No hay una sesión activa con permisos asignados.');
      return;
    }

    this.loadingState.set(!this.overviewState());
    this.refreshingState.set(Boolean(this.overviewState()));
    this.errorState.set(null);

    this.api
      .loadOverview(this.permissionsList())
      .pipe(
        finalize(() => {
          this.loadingState.set(false);
          this.refreshingState.set(false);
        }),
      )
      .subscribe({
        next: (response) => this.overviewState.set(toHomeOverview(response)),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  hasPermission(permission: PermissionCode): boolean {
    return this.permissions.has(permission);
  }

  toggleQuickAccessItem(itemId: string): void {
    const availableIds = this.availableQuickAccessItems().map((item) => item.id);
    if (!availableIds.includes(itemId)) return;

    const currentIds = this.selectedQuickAccessItemIdsState();
    const nextIds = currentIds.includes(itemId)
      ? currentIds.filter((currentId) => currentId !== itemId)
      : [...currentIds, itemId];

    if (nextIds.length === 0) return;

    const orderedIds = availableIds.filter((availableId) => nextIds.includes(availableId));
    this.selectedQuickAccessItemIdsState.set(orderedIds);
    this.preferences.saveQuickAccessIds(this.userPreferenceKey(), orderedIds);
  }

  private restoreQuickAccessPreferences(): void {
    const availableIds = this.availableQuickAccessItems().map((item) => item.id);
    const storedIds = this.preferences.readQuickAccessIds(this.userPreferenceKey());
    const selectedIds = storedIds
      ? availableIds.filter((itemId) => storedIds.includes(itemId))
      : availableIds.slice(0, 6);

    this.selectedQuickAccessItemIdsState.set(
      selectedIds.length > 0 ? selectedIds : availableIds.slice(0, 1),
    );
  }

  private userPreferenceKey(): string {
    const user = this.userState();
    return user?.id || user?.email || 'anonymous';
  }
}
