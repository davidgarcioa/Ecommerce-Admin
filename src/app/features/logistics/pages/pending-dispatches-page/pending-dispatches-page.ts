import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LogisticsOrdersTableComponent } from '../../components/logistics-orders-table/logistics-orders-table';
import { LogisticsFilters, LogisticsOrderListItem } from '../../data-access/logistics.models';
import { LogisticsStore } from '../../data-access/logistics.store';
import { DEFAULT_LOGISTICS_FILTERS } from '../../utils/logistics.constants';

@Component({
  selector: 'app-pending-dispatches-page',
  imports: [LogisticsOrdersTableComponent],
  providers: [LogisticsStore],
  templateUrl: './pending-dispatches-page.html',
  styleUrl: './pending-dispatches-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingDispatchesPageComponent implements OnInit {
  private readonly store = inject(LogisticsStore);
  private readonly router = inject(Router);

  readonly orders = this.store.filteredOrders;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly canUpdateShipment = this.store.canUpdateShipment;

  ngOnInit(): void {
    const filters: LogisticsFilters = {
      ...DEFAULT_LOGISTICS_FILTERS,
      orderStatus: 'Confirmed',
      deliveryStatus: 'Pending',
    };
    this.store.applyFilters(filters);
  }

  back(): void {
    void this.router.navigate(['/torre-logistica']);
  }

  refresh(): void {
    this.store.loadOrders();
  }

  openOrder(order: LogisticsOrderListItem): void {
    void this.router.navigate(['/torre-logistica/despachos', order.id]);
  }
}
