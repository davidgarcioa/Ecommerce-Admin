import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';

import { PermissionsService } from '../../../core/services/permissions.service';
import { DailyOrder } from '../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../daily-report/services/imported-orders-store.service';
import { DEFAULT_ORDER_FILTERS, OFFICE_PERMISSIONS } from '../utils/office.constants';
import { hasNovelty } from '../utils/order-status.utils';
import {
  DeliveryStatus,
  OfficeActiveView,
  Order,
  OrderCustomer,
  OrderFilters,
  OrderHistoryItem,
  OrderListItem,
  OrderObservation,
  OrderPagination,
  OrderQuery,
  OrderSortField,
  OrderStatistics,
  OrderStatus,
  PaymentStatus,
  SortDirection,
  UpdateDeliveryStatusRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
} from './office.models';
import { toOrderCustomer, toOrderListItem, toOrderObservation } from './office.mapper';
import { OfficeApiService } from './office-api.service';
import { toOfficeOrders, toOrderStatistics } from './imported-orders.mapper';

const EMPTY_STATISTICS: OrderStatistics = {
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

const EMPTY_PAGINATION: OrderPagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

@Injectable()
export class OfficeStore {
  private readonly api = inject(OfficeApiService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);

  private readonly ordersState = signal<readonly Order[]>([]);
  private readonly selectedOrderState = signal<Order | null>(null);
  private readonly selectedCustomerState = signal<OrderCustomer | null>(null);
  private readonly statisticsState = signal<OrderStatistics>(EMPTY_STATISTICS);
  private readonly historyState = signal<readonly OrderHistoryItem[]>([]);
  private readonly filtersState = signal<OrderFilters>(DEFAULT_ORDER_FILTERS);
  private readonly searchState = signal('');
  private readonly sortByState = signal<OrderSortField>('createdAt');
  private readonly sortDirectionState = signal<SortDirection>('desc');
  private readonly paginationState = signal<OrderPagination>(EMPTY_PAGINATION);
  private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set<string>());
  private readonly loadingState = signal(false);
  private readonly loadingDetailState = signal(false);
  private readonly savingState = signal(false);
  private readonly changingStatusState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly lastUpdatedState = signal<string | null>(null);
  private readonly activeViewState = signal<OfficeActiveView>('orders');

  readonly orders = this.ordersState.asReadonly();
  readonly selectedOrder = this.selectedOrderState.asReadonly();
  readonly selectedCustomer = this.selectedCustomerState.asReadonly();
  readonly statistics = this.statisticsState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly search = this.searchState.asReadonly();
  readonly sortBy = this.sortByState.asReadonly();
  readonly sortDirection = this.sortDirectionState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadingDetail = this.loadingDetailState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly changingStatus = this.changingStatusState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();
  readonly activeView = this.activeViewState.asReadonly();

  readonly canReadOrders = computed(() => this.permissionsService.has(OFFICE_PERMISSIONS.read));
  readonly canUpdateOrders = computed(() => this.permissionsService.has(OFFICE_PERMISSIONS.update));
  readonly canChangeStatus = computed(() => this.permissionsService.has(OFFICE_PERMISSIONS.update));
  readonly canViewHistory = computed(() => this.permissionsService.has(OFFICE_PERMISSIONS.read));
  readonly canManagePayment = computed(() =>
    this.permissionsService.has(OFFICE_PERMISSIONS.update),
  );
  readonly canManageDelivery = computed(() =>
    this.permissionsService.has(OFFICE_PERMISSIONS.update),
  );
  readonly canViewStatistics = computed(() =>
    this.permissionsService.has(OFFICE_PERMISSIONS.statistics),
  );

  readonly listItems = computed(() => this.ordersState().map(toOrderListItem));
  readonly totalOrders = computed(() => this.statisticsState().totalOrders);
  readonly pendingOrders = computed(
    () => this.ordersState().filter((order) => order.orderStatus === 'Pending').length,
  );
  readonly confirmedOrders = computed(
    () => this.ordersState().filter((order) => order.orderStatus === 'Confirmed').length,
  );
  readonly cancelledOrders = computed(() => this.statisticsState().cancelled);
  readonly ordersPendingPayment = computed(
    () => this.ordersState().filter((order) => order.paymentStatus === 'Pending').length,
  );
  readonly ordersPendingConfirmation = computed(() => this.pendingOrders());
  readonly ordersWithNovelty = computed(
    () => this.ordersState().filter((order) => hasNovelty(order)).length,
  );
  readonly todayOrders = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.ordersState().filter((order) => order.createdAt.startsWith(today)).length;
  });
  readonly filteredOrders = computed(() => this.listItems());
  readonly hasOrders = computed(() => this.ordersState().length > 0);
  readonly hasSelection = computed(() => this.selectedIdsState().size > 0);
  readonly observations = computed<readonly OrderObservation[]>(() => {
    const order = this.selectedOrderState();
    const observation = order ? toOrderObservation(order) : null;
    return observation ? [observation] : [];
  });

  loadOrders(): void {
    if (!this.canReadOrders()) {
      this.errorState.set('No tienes permisos para consultar pedidos.');
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
          this.ordersState.set(result.data);
          this.paginationState.set(result.meta);
          this.statisticsState.set(statistics);
          this.lastUpdatedState.set(new Date().toISOString());
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  loadOrderDetail(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);

    forkJoin({
      order: this.api.getOrder(id),
      history: this.api.getHistory(id),
    })
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: ({ order, history }) => {
          this.selectedOrderState.set(order);
          this.selectedCustomerState.set(order ? toOrderCustomer(order) : null);
          this.historyState.set(history);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  applySearch(search: string): void {
    this.searchState.set(search);
    this.paginationState.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadOrders();
  }

  applyFilters(filters: OrderFilters): void {
    this.filtersState.set(filters);
    this.paginationState.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadOrders();
  }

  clearFilters(): void {
    this.filtersState.set(DEFAULT_ORDER_FILTERS);
    this.searchState.set('');
    this.paginationState.update((pagination) => ({ ...pagination, page: 1 }));
    this.loadOrders();
  }

  setPage(page: number, pageSize: number): void {
    this.paginationState.update((pagination) => ({ ...pagination, page, pageSize }));
    this.loadOrders();
  }

  setSort(sortBy: OrderSortField, sortDirection: SortDirection): void {
    this.sortByState.set(sortBy);
    this.sortDirectionState.set(sortDirection);
    this.loadOrders();
  }

  setSelectedIds(orders: readonly OrderListItem[]): void {
    this.selectedIdsState.set(new Set(orders.map((order) => order.id)));
  }

  setActiveView(view: OfficeActiveView): void {
    this.activeViewState.set(view);
  }

  updateOrder(id: string, payload: UpdateOrderRequest, onSuccess?: (order: Order) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateOrder(id, payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (order) => {
          this.upsertOrder(order);
          this.selectedOrderState.set(order);
          this.selectedCustomerState.set(toOrderCustomer(order));
          onSuccess?.(order);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  updateOrderStatus(id: string, payload: UpdateOrderStatusRequest): void {
    this.mutateStatus(id, () => this.api.updateOrderStatus(id, payload));
  }

  updatePaymentStatus(id: string, payload: UpdatePaymentStatusRequest): void {
    this.mutateStatus(id, () => this.api.updatePaymentStatus(id, payload));
  }

  updateDeliveryStatus(id: string, payload: UpdateDeliveryStatusRequest): void {
    this.mutateStatus(id, () => this.api.updateDeliveryStatus(id, payload));
  }

  confirmOrder(id: string, notes?: string): void {
    this.updateOrderStatus(id, { orderStatus: 'Confirmed', notes });
  }

  addObservation(id: string, observations: string): void {
    this.updateOrder(id, { observations });
  }

  private mutateStatus(
    id: string,
    sourceFactory: () => ReturnType<OfficeApiService['updateOrderStatus']>,
  ): void {
    this.changingStatusState.set(true);
    this.errorState.set(null);

    sourceFactory()
      .pipe(finalize(() => this.changingStatusState.set(false)))
      .subscribe({
        next: (order) => {
          this.upsertOrder(order);
          this.selectedOrderState.set(order);
          this.selectedCustomerState.set(toOrderCustomer(order));
          this.loadOrderDetail(id);
          this.loadOrders();
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  private currentQuery(): OrderQuery {
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

  private applyImportedOrders(importedOrders: readonly DailyOrder[]): void {
    const orders = this.filterImportedOrders(toOfficeOrders(importedOrders));
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

  private filterImportedOrders(orders: readonly Order[]): readonly Order[] {
    const filters = this.filtersState();
    const search = this.searchState().trim().toLowerCase();

    return orders.filter((order) => {
      if (filters.orderStatus !== 'all' && order.orderStatus !== filters.orderStatus) return false;
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
      if (filters.urgent === 'urgent' && !order.urgent) return false;
      if (filters.urgent === 'standard' && order.urgent) return false;
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
    });
  }

  private upsertOrder(order: Order): void {
    this.ordersState.update((orders) => {
      const exists = orders.some((item) => item.id === order.id);
      return exists
        ? orders.map((item) => (item.id === order.id ? order : item))
        : [order, ...orders];
    });
  }
}

export const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Packed', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Returned'],
  Delivered: ['Returned', 'Refunded'],
  Cancelled: [],
  Returned: ['Refunded'],
  Refunded: [],
};

export const PAYMENT_STATUS_TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> =
  {
    Pending: ['Paid', 'Partial', 'Failed'],
    Paid: ['Refunded'],
    Refunded: [],
    Failed: ['Pending'],
    Partial: ['Paid', 'Refunded', 'Failed'],
  };

export const DELIVERY_STATUS_TRANSITIONS: Readonly<
  Record<DeliveryStatus, readonly DeliveryStatus[]>
> = {
  Pending: ['Assigned', 'Failed'],
  Assigned: ['In Transit', 'Failed'],
  'In Transit': ['Delivered', 'Returned', 'Failed'],
  Delivered: ['Returned'],
  Returned: [],
  Failed: ['Pending'],
};
