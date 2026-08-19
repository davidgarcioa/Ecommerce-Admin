import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TableActionClick } from '../../../../shared/components/data-table/models/table-action.model';
import { OfficeFiltersComponent } from '../../components/office-filters/office-filters';
import { OfficeHeaderComponent } from '../../components/office-header/office-header';
import { OfficeSummaryComponent } from '../../components/office-summary/office-summary';
import { OrdersTableComponent } from '../../components/orders-table/orders-table';
import { OrderFilters, OrderListItem } from '../../data-access/office.models';
import { OfficeStore } from '../../data-access/office.store';

@Component({
  selector: 'app-office-page',
  imports: [
    OfficeHeaderComponent,
    OfficeSummaryComponent,
    OfficeFiltersComponent,
    OrdersTableComponent,
  ],
  providers: [OfficeStore],
  templateUrl: './office-page.html',
  styleUrl: './office-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfficePageComponent implements OnInit {
  private readonly store = inject(OfficeStore);
  private readonly router = inject(Router);

  readonly orders = this.store.filteredOrders;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly filters = this.store.filters;
  readonly search = this.store.search;
  readonly lastUpdated = this.store.lastUpdated;
  readonly totalOrders = this.store.totalOrders;
  readonly pendingOrders = this.store.pendingOrders;
  readonly confirmedOrders = this.store.confirmedOrders;
  readonly ordersPendingPayment = this.store.ordersPendingPayment;
  readonly ordersWithNovelty = this.store.ordersWithNovelty;
  readonly cancelledOrders = this.store.cancelledOrders;
  readonly todayOrders = this.store.todayOrders;
  readonly statistics = this.store.statistics;
  readonly canUpdateOrders = this.store.canUpdateOrders;

  ngOnInit(): void {
    this.store.loadOrders();
  }

  refresh(): void {
    this.store.loadOrders();
  }

  openPending(): void {
    void this.router.navigate(['/oficina/pendientes']);
  }

  applySearch(search: string): void {
    this.store.applySearch(search);
  }

  applyFilters(filters: OrderFilters): void {
    this.store.applyFilters(filters);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  openOrder(order: OrderListItem): void {
    void this.router.navigate(['/oficina/pedidos', order.id]);
  }

  onAction(event: TableActionClick<OrderListItem>): void {
    switch (event.action.id) {
      case 'view':
        this.openOrder(event.row);
        break;
      case 'edit':
        void this.router.navigate(['/oficina/pedidos', event.row.id, 'editar']);
        break;
      case 'confirm':
        this.store.confirmOrder(event.row.id, 'Confirmado desde Oficina.');
        break;
      case 'status':
        void this.router.navigate(['/oficina/pedidos', event.row.id]);
        break;
      case 'history':
        void this.router.navigate(['/oficina/pedidos', event.row.id, 'historial']);
        break;
      case 'copy-phone':
        void navigator.clipboard?.writeText(event.row.customerPhone);
        break;
    }
  }
}
