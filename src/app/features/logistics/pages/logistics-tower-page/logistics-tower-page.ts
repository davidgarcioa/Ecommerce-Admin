import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { TableActionClick } from '../../../../shared/components/data-table/models/table-action.model';
import { LogisticsFiltersComponent } from '../../components/logistics-filters/logistics-filters';
import { LogisticsHeaderComponent } from '../../components/logistics-header/logistics-header';
import { LogisticsOrdersTableComponent } from '../../components/logistics-orders-table/logistics-orders-table';
import { LogisticsSummaryComponent } from '../../components/logistics-summary/logistics-summary';
import { LogisticsFilters, LogisticsOrderListItem } from '../../data-access/logistics.models';
import { LogisticsStore } from '../../data-access/logistics.store';

@Component({
  selector: 'app-logistics-tower-page',
  imports: [
    LogisticsHeaderComponent,
    LogisticsSummaryComponent,
    LogisticsFiltersComponent,
    LogisticsOrdersTableComponent,
  ],
  providers: [LogisticsStore],
  templateUrl: './logistics-tower-page.html',
  styleUrl: './logistics-tower-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticsTowerPageComponent implements OnInit {
  private readonly store = inject(LogisticsStore);
  private readonly router = inject(Router);

  readonly orders = this.store.filteredOrders;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly filters = this.store.filters;
  readonly search = this.store.search;
  readonly lastUpdated = this.store.lastUpdated;
  readonly pendingDispatches = this.store.pendingDispatches;
  readonly readyForDispatch = this.store.readyForDispatch;
  readonly inTransitOrders = this.store.inTransitOrders;
  readonly deliveredToday = this.store.deliveriesToday;
  readonly failedDeliveries = this.store.failedDeliveries;
  readonly ordersWithIncidents = this.store.ordersWithIncidents;
  readonly pendingReturns = this.store.pendingReturns;
  readonly returnedOrders = this.store.returnedOrders;
  readonly canUpdateShipment = this.store.canUpdateShipment;
  readonly filtersOpen = signal(false);
  readonly activeFilterCount = computed(() => {
    const filters = this.filters();

    return (
      Number(this.search().trim().length > 0) +
      Number(filters.orderStatus !== 'all') +
      Number(filters.deliveryStatus !== 'all') +
      Number(filters.paymentStatus !== 'all') +
      Number(filters.carrier.trim().length > 0) +
      Number(filters.city.trim().length > 0) +
      Number(filters.withoutTracking) +
      Number(filters.withIncident) +
      Number(filters.withReturn) +
      Number(filters.dateFrom.length > 0) +
      Number(filters.dateTo.length > 0)
    );
  });

  ngOnInit(): void {
    this.store.loadOrders();
  }

  refresh(): void {
    this.store.loadOrders();
  }

  openPending(): void {
    void this.router.navigate(['/torre-logistica/pendientes']);
  }

  openIncidents(): void {
    void this.router.navigate(['/torre-logistica/incidencias']);
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  applySearch(search: string): void {
    this.store.applySearch(search);
  }

  applyFilters(filters: LogisticsFilters): void {
    this.store.applyFilters(filters);
  }

  applyFilterState(event: { readonly search: string; readonly filters: LogisticsFilters }): void {
    this.store.applySearchAndFilters(event.search, event.filters);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  openOrder(order: LogisticsOrderListItem): void {
    void this.router.navigate(['/torre-logistica/despachos', order.id]);
  }

  onAction(event: TableActionClick<LogisticsOrderListItem>): void {
    switch (event.action.id) {
      case 'view':
      case 'shipment':
        this.openOrder(event.row);
        break;
      case 'delivery-status':
        this.store.nextDeliveryStatus(event.row.id, event.row.deliveryStatus);
        break;
      case 'history':
        void this.router.navigate(['/torre-logistica/despachos', event.row.id]);
        break;
      case 'copy-tracking':
        if (event.row.trackingNumber) void navigator.clipboard?.writeText(event.row.trackingNumber);
        break;
      case 'office':
        void this.router.navigate(['/oficina/pedidos', event.row.id]);
        break;
    }
  }
}
