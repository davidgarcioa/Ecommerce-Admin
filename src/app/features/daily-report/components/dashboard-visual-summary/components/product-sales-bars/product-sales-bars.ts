import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

import { accountScopedStorageKey } from '../../../../../../core/services/account-storage.service';
import { AnimateOnViewDirective } from '../../../../../../shared/directives/animate-on-view.directive';
import { ProductGroupPerformance } from '../../../../models/product-group-performance.model';
import { formatDailyValue } from '../../../../utils/daily-report.utils';
import { ProductShare } from '../../dashboard-visual-summary.models';
import { clampPercentage, formatCompactCurrency } from '../../dashboard-visual-summary.utils';

const MAX_VISIBLE_PRODUCT_GROUPS = 5;
const PRODUCT_GROUP_PREFERENCES_KEY = 'ecommerce_dashboard_product_group_preferences';

interface ProductGroupSelectorOption {
  readonly id: string;
  readonly name: string;
  readonly sales: string;
}

@Component({
  selector: 'app-product-sales-bars',
  imports: [AnimateOnViewDirective],
  templateUrl: './product-sales-bars.html',
  styleUrl: './product-sales-bars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSalesBarsComponent {
  readonly productGroups = input.required<readonly ProductGroupPerformance[]>();
  readonly selectorOpen = signal(false);
  readonly selectedProductGroupIds = signal<readonly string[]>(loadProductGroupPreferences());

  constructor() {
    effect(() => {
      saveProductGroupPreferences(this.selectedProductGroupIds());
    });
  }

  readonly productGroupOptions = computed<readonly ProductGroupPerformance[]>(() =>
    [...this.productGroups()].sort((a, b) => b.sales - a.sales),
  );

  readonly productGroupSelectorOptions = computed<readonly ProductGroupSelectorOption[]>(() =>
    this.productGroupOptions().map((group) => ({
      id: group.id,
      name: group.name,
      sales: formatDailyValue(group.sales, 'currency'),
    })),
  );

  readonly visibleProductGroups = computed<readonly ProductGroupPerformance[]>(() => {
    const sortedGroups = this.productGroupOptions();
    const selectedIds = this.selectedProductGroupIds();
    const selectedGroups = sortedGroups.filter((group) => selectedIds.includes(group.id));

    return selectedGroups.length > 0
      ? selectedGroups
      : sortedGroups.slice(0, MAX_VISIBLE_PRODUCT_GROUPS);
  });

  readonly productShares = computed<readonly ProductShare[]>(() => {
    const groups = this.visibleProductGroups();
    const totalSales = groups.reduce((sum, group) => sum + group.sales, 0);

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      sales: formatDailyValue(group.sales, 'currency'),
      percentage: totalSales === 0 ? 0 : clampPercentage((group.sales / totalSales) * 100),
      percentageLabel: formatDailyValue(
        totalSales === 0 ? 0 : (group.sales / totalSales) * 100,
        'percentage',
      ),
    }));
  });

  readonly productSalesTotal = computed(() => {
    const totalSales = this.visibleProductGroups().reduce((sum, group) => sum + group.sales, 0);
    return formatCompactCurrency(totalSales);
  });

  readonly topProductShare = computed(() => this.productShares()[0]);

  toggleSelector(): void {
    this.selectorOpen.update((open) => !open);
  }

  closeSelector(): void {
    this.selectorOpen.set(false);
  }

  isProductGroupSelected(groupId: string): boolean {
    const selectedIds = this.selectedProductGroupIds();
    return selectedIds.length === 0
      ? this.productGroupOptions()
          .slice(0, MAX_VISIBLE_PRODUCT_GROUPS)
          .some((group) => group.id === groupId)
      : selectedIds.includes(groupId);
  }

  isProductGroupDisabled(groupId: string): boolean {
    const selectedIds = this.selectedProductGroupIds();
    return !selectedIds.includes(groupId) && selectedIds.length >= MAX_VISIBLE_PRODUCT_GROUPS;
  }

  toggleProductGroup(groupId: string): void {
    this.selectedProductGroupIds.update((selectedIds) => {
      const effectiveSelectedIds =
        selectedIds.length === 0
          ? this.productGroupOptions()
              .slice(0, MAX_VISIBLE_PRODUCT_GROUPS)
              .map((group) => group.id)
          : selectedIds;

      if (effectiveSelectedIds.includes(groupId)) {
        return effectiveSelectedIds.length === 1
          ? effectiveSelectedIds
          : effectiveSelectedIds.filter((selectedId) => selectedId !== groupId);
      }

      if (effectiveSelectedIds.length >= MAX_VISIBLE_PRODUCT_GROUPS) {
        return effectiveSelectedIds;
      }

      return [...effectiveSelectedIds, groupId];
    });
  }
}

function loadProductGroupPreferences(): readonly string[] {
  try {
    const rawPreferences = localStorage.getItem(
      accountScopedStorageKey(PRODUCT_GROUP_PREFERENCES_KEY),
    );

    if (rawPreferences === null) {
      return [];
    }

    const parsedPreferences = JSON.parse(rawPreferences) as unknown;

    if (!Array.isArray(parsedPreferences)) {
      return [];
    }

    return parsedPreferences
      .filter((groupId): groupId is string => typeof groupId === 'string')
      .filter((groupId, index, groupIds) => groupIds.indexOf(groupId) === index)
      .slice(0, MAX_VISIBLE_PRODUCT_GROUPS);
  } catch {
    return [];
  }
}

function saveProductGroupPreferences(selectedGroupIds: readonly string[]): void {
  try {
    localStorage.setItem(
      accountScopedStorageKey(PRODUCT_GROUP_PREFERENCES_KEY),
      JSON.stringify(selectedGroupIds),
    );
  } catch {
    // Las preferencias visuales no deben bloquear el dashboard.
  }
}
