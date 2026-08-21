import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { finalize, forkJoin, Observable, of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { DailyOrder } from '../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../daily-report/services/imported-orders-store.service';
import { toOfficeOrders, toOrderStatistics } from '../../office/data-access/imported-orders.mapper';
import {
  DEFAULT_LOGISTICS_FILTERS,
  LOGISTICS_DELIVERY_STATUS_TRANSITIONS,
  LOGISTICS_PERMISSIONS,
} from '../utils/logistics.constants';
import { hasLogisticsIncident, hasReturn } from '../utils/logistics-status.utils';
import { toLogisticsOrderListItem } from './logistics.mapper';
import {
  DeliveryDetail,
  LogisticsDeliveryStatus,
  LogisticsFilters,
  LogisticsHistoryItem,
  LogisticsOrder,
  LogisticsOrderListItem,
  LogisticsPagination,
  LogisticsQuery,
  LogisticsResource,
  LogisticsSortDirection,
  LogisticsSortField,
  LogisticsStatistics,
  ReturnDetail,
  UpdateLogisticsDeliveryStatusRequest,
  UpdateShipmentRequest,
} from './logistics.models';
import { LogisticsApiService } from './logistics-api.service';

const EMPTY_STATISTICS: LogisticsStatistics = {
  totalOrders: 0,
  sales: 0,
  averageTicket: 0,
  cancelled: 0,
  delivered: 0,
  inTransit: 0,
  urgent: 0,
  soldValue: 0,
  pendingValue: 0,
};

const EMPTY_PAGINATION: LogisticsPagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

@Injectable()
export class LogisticsStore {
  private readonly api = inject(LogisticsApiService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);

  private readonly ordersState = signal<readonly LogisticsOrder[]>([]);
  private readonly selectedOrderState = signal<LogisticsOrder | null>(null);
  private readonly deliveriesState = signal<readonly DeliveryDetail[]>([]);
  private readonly returnsState = signal<readonly ReturnDetail[]>([]);
  private readonly selectedReturnState = signal<ReturnDetail | null>(null);
  private readonly historyState = signal<readonly LogisticsHistoryItem[]>([]);
  private readonly filtersState = signal<LogisticsFilters>(DEFAULT_LOGISTICS_FILTERS);
  private readonly searchState = signal('');
  private readonly sortByState = signal<LogisticsSortField>('updatedAt');
  private readonly sortDirectionState = signal<LogisticsSortDirection>('desc');
  private readonly paginationState = signal<LogisticsPagination>(EMPTY_PAGINATION);
  private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set<string>());
  private readonly loadingState = signal(false);
  private readonly loadingDetailState = signal(false);
  private readonly savingState = signal(false);
  private readonly updatingStatusState = signal(false);
  private readonly registeringReturnState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly lastUpdatedState = signal<string | null>(null);

  readonly orders = this.ordersState.asReadonly();
  readonly selectedOrder = this.selectedOrderState.asReadonly();
  readonly deliveries = this.deliveriesState.asReadonly();
  readonly returns = this.returnsState.asReadonly();
  readonly selectedReturn = this.selectedReturnState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly search = this.searchState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadingDetail = this.loadingDetailState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly updatingStatus = this.updatingStatusState.asReadonly();
  readonly registeringReturn = this.registeringReturnState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();

  readonly canReadLogistics = computed(() =>
    this.permissionsService.has(LOGISTICS_PERMISSIONS.readOrders),
  );
  readonly canUpdateShipment = computed(() =>
    this.permissionsService.has(LOGISTICS_PERMISSIONS.updateOrders),
  );
  readonly canUpdateDelivery = this.canUpdateShipment;
  readonly canRegisterReturn = this.canUpdateShipment;
  readonly canManageIncidents = this.canUpdateShipment;
  readonly canViewHistory = this.canReadLogistics;
  readonly canViewStatistics = computed(() =>
    this.permissionsService.has(LOGISTICS_PERMISSIONS.statistics),
  );

  readonly listItems = computed(() => this.ordersState().map(toLogisticsOrderListItem));
  readonly filteredOrders = computed(() => this.listItems());
  readonly totalLogisticsOrders = computed(() => this.statisticsState().totalOrders);
  private readonly statisticsState = signal<LogisticsStatistics>(EMPTY_STATISTICS);
  readonly statistics = this.statisticsState.asReadonly();
  readonly pendingDispatches = computed(
    () =>
      this.ordersState().filter(
        (order) =>
          ['Confirmed', 'Processing'].includes(order.orderStatus) &&
          order.deliveryStatus === 'Pending',
      ).length,
  );
  readonly readyForDispatch = computed(
    () => this.ordersState().filter((order) => order.orderStatus === 'Packed').length,
  );
  readonly inTransitOrders = computed(() => this.statisticsState().inTransit);
  readonly deliveredOrders = computed(() => this.statisticsState().delivered);
  readonly failedDeliveries = computed(
    () => this.ordersState().filter((order) => order.deliveryStatus === 'Failed').length,
  );
  readonly returnedOrders = computed(
    () => this.ordersState().filter((order) => hasReturn(order)).length,
  );
  readonly ordersWithIncidents = computed(
    () => this.ordersState().filter((order) => hasLogisticsIncident(order)).length,
  );
  readonly deliveriesToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.ordersState().filter(
      (order) => order.deliveryStatus === 'Delivered' && order.updatedAt.startsWith(today),
    ).length;
  });
  readonly pendingReturns = computed(
    () => this.ordersState().filter((order) => order.deliveryStatus === 'Returned').length,
  );
  readonly hasOrders = computed(() => this.ordersState().length > 0);
  readonly hasSelection = computed(() => this.selectedIdsState().size > 0);

  loadOrders(): void {
    if (!this.canReadLogistics()) {
      this.errorState.set('No tienes permisos para consultar Torre Logística.');
      return;
    }

    const importedOrders = this.importedOrdersStore.orders();
    if (importedOrders.length > 0) {
      this.applyImportedOrders(importedOrders);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    const query = this.currentQuery();
    forkJoin({
      result: this.api.listOrders(query),
      statistics: this.canViewStatistics() ? this.api.getStatistics(query) : of(EMPTY_STATISTICS),
    })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: ({ result, statistics }) => {
          if (result.data.length === 0) {
            this.applyLocalOrders([]);
            return;
          }

          this.ordersState.set(result.data);
          this.paginationState.set(result.meta);
          this.statisticsState.set(statistics);
          this.lastUpdatedState.set(new Date().toISOString());
        },
        error: () => this.applyLocalOrders([]),
      });
  }

  loadDetail(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);

    forkJoin({
      order: this.api.getOrder(id),
      history: this.api.getOrderHistory(id),
    })
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: ({ order, history }) => {
          this.selectedOrderState.set(order);
          this.historyState.set(history);
        },
        error: (error: Error) => {
          const localOrder = this.ordersState().find((order) => order.id === id) ?? null;

          if (!localOrder) {
            this.errorState.set(error.message);
            return;
          }

          this.selectedOrderState.set(localOrder);
          this.historyState.set([]);
        },
      });
  }

  loadDeliveries(): void {
    this.loadResourceList(this.api.listDeliveries(), this.deliveriesState);
  }

  loadReturns(): void {
    this.loadResourceList(this.api.listReturns(), this.returnsState);
  }

  loadReturn(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);
    this.api
      .getReturn(id)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (item) => this.selectedReturnState.set(item),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  applySearch(search: string): void {
    this.searchState.set(search);
    this.paginationState.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadOrders();
  }

  applyFilters(filters: LogisticsFilters): void {
    this.filtersState.set(filters);
    this.paginationState.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadOrders();
  }

  applySearchAndFilters(search: string, filters: LogisticsFilters): void {
    this.searchState.set(search);
    this.filtersState.set(filters);
    this.paginationState.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadOrders();
  }

  clearFilters(): void {
    this.filtersState.set(DEFAULT_LOGISTICS_FILTERS);
    this.searchState.set('');
    this.paginationState.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadOrders();
  }

  setSelectedIds(orders: readonly LogisticsOrderListItem[]): void {
    this.selectedIdsState.set(new Set(orders.map((order) => order.id)));
  }

  updateShipment(id: string, payload: UpdateShipmentRequest, onSuccess?: () => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateShipment(id, payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (order) => {
          this.upsertOrder(order);
          this.selectedOrderState.set(order);
          this.loadOrders();
          onSuccess?.();
        },
        error: (error: Error) => {
          const order = this.ordersState().find((item) => item.id === id);

          if (!order) {
            this.errorState.set(error.message);
            return;
          }

          const updatedOrder = { ...order, ...payload, updatedAt: new Date().toISOString() };
          this.upsertOrder(updatedOrder);
          this.selectedOrderState.set(updatedOrder);
          this.statisticsState.set(toOrderStatistics(this.ordersState()));
          this.errorState.set(null);
          onSuccess?.();
        },
      });
  }

  updateDeliveryStatus(id: string, payload: UpdateLogisticsDeliveryStatusRequest): void {
    this.updatingStatusState.set(true);
    this.errorState.set(null);

    this.api
      .updateDeliveryStatus(id, payload)
      .pipe(finalize(() => this.updatingStatusState.set(false)))
      .subscribe({
        next: (order) => {
          this.upsertOrder(order);
          this.selectedOrderState.set(order);
          this.loadDetail(id);
          this.loadOrders();
        },
        error: (error: Error) => {
          const order = this.ordersState().find((item) => item.id === id);

          if (!order) {
            this.errorState.set(error.message);
            return;
          }

          const updatedOrder = {
            ...order,
            deliveryStatus: payload.deliveryStatus,
            observations: payload.notes ?? order.observations,
            updatedAt: new Date().toISOString(),
          };
          this.upsertOrder(updatedOrder);
          this.selectedOrderState.set(updatedOrder);
          this.statisticsState.set(toOrderStatistics(this.ordersState()));
          this.errorState.set(null);
        },
      });
  }

  nextDeliveryStatus(id: string, current: LogisticsDeliveryStatus): void {
    const next = LOGISTICS_DELIVERY_STATUS_TRANSITIONS[current][0];
    if (!next) return;
    this.updateDeliveryStatus(id, { deliveryStatus: next, notes: 'Cambio desde Torre Logística.' });
  }

  private currentQuery(): LogisticsQuery {
    const pagination = this.paginationState();
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy: this.sortByState(),
      sortDirection: this.sortDirectionState(),
      search: this.searchState(),
      filters: this.filtersState(),
    };
  }

  private upsertOrder(order: LogisticsOrder): void {
    this.ordersState.update((orders) => {
      const exists = orders.some((item) => item.id === order.id);
      return exists
        ? orders.map((item) => (item.id === order.id ? order : item))
        : [order, ...orders];
    });
  }

  private applyImportedOrders(importedOrders: readonly DailyOrder[]): void {
    this.applyLocalOrders(toOfficeOrders(importedOrders));
  }

  private applyLocalOrders(source: readonly LogisticsOrder[]): void {
    const orders = this.filterOrders(source);
    const pagination = this.paginationState();

    this.ordersState.set(orders);
    this.statisticsState.set(toOrderStatistics(orders));
    this.paginationState.set({
      ...pagination,
      total: orders.length,
      totalPages: Math.max(1, Math.ceil(orders.length / pagination.pageSize)),
    });
    this.errorState.set(null);
    this.loadingState.set(false);
    this.lastUpdatedState.set(new Date().toISOString());
  }

  private filterOrders(orders: readonly LogisticsOrder[]): readonly LogisticsOrder[] {
    const filters = this.filtersState();
    const search = this.searchState().trim().toLowerCase();

    return orders
      .filter((order) => {
        if (filters.orderStatus !== 'all' && order.orderStatus !== filters.orderStatus)
          return false;
        if (filters.paymentStatus !== 'all' && order.paymentStatus !== filters.paymentStatus) {
          return false;
        }
        if (filters.deliveryStatus !== 'all' && order.deliveryStatus !== filters.deliveryStatus) {
          return false;
        }
        if (filters.city && !order.city.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
        if (
          filters.carrier &&
          !String(order.carrier ?? '')
            .toLowerCase()
            .includes(filters.carrier.toLowerCase())
        ) {
          return false;
        }
        if (filters.withoutTracking && order.trackingNumber) return false;
        if (filters.withIncident && !hasLogisticsIncident(order)) return false;
        if (filters.withReturn && !hasReturn(order)) return false;
        if (filters.dateFrom && order.createdAt.slice(0, 10) < filters.dateFrom) return false;
        if (filters.dateTo && order.createdAt.slice(0, 10) > filters.dateTo) return false;
        if (!search) return true;

        return [
          order.orderNumber,
          order.customerName,
          order.customerPhone,
          order.productName,
          order.productGroupName,
          order.city,
          order.carrier ?? '',
          order.trackingNumber ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);
      })
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }

  private loadResourceList<TResource extends LogisticsResource>(
    source: Observable<readonly TResource[]>,
    target: WritableSignal<readonly TResource[]>,
  ): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    source.pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (items) => target.set(items),
      error: (error: Error) => this.errorState.set(error.message),
    });
  }
}
