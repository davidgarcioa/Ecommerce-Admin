import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TableActionClick } from '../../../../shared/components/data-table/models/table-action.model';
import { OrdersTableComponent } from '../../components/orders-table/orders-table';
import { OrderFilters, OrderListItem } from '../../data-access/office.models';
import { OfficeStore } from '../../data-access/office.store';
import { DEFAULT_ORDER_FILTERS } from '../../utils/office.constants';

@Component({
  selector: 'app-pending-orders-page',
  imports: [OrdersTableComponent],
  providers: [OfficeStore],
  templateUrl: './pending-orders-page.html',
  styleUrl: './pending-orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingOrdersPageComponent implements OnInit {
  private readonly store = inject(OfficeStore);
  private readonly router = inject(Router);

  readonly orders = this.store.filteredOrders;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly canUpdateOrders = this.store.canUpdateOrders;

  ngOnInit(): void {
    const filters: OrderFilters = {
      ...DEFAULT_ORDER_FILTERS,
      pendingConfirmation: true,
      orderStatus: 'Pending',
    };
    this.store.applyFilters(filters);
  }

  back(): void {
    void this.router.navigate(['/oficina']);
  }

  refresh(): void {
    this.store.loadOrders();
  }

  openOrder(order: OrderListItem): void {
    void this.router.navigate(['/oficina/pedidos', order.id]);
  }

  onAction(event: TableActionClick<OrderListItem>): void {
    switch (event.action.id) {
      case 'view':
      case 'status':
        this.openOrder(event.row);
        break;
      case 'edit':
        void this.router.navigate(['/oficina/pedidos', event.row.id, 'editar']);
        break;
      case 'confirm':
        this.store.confirmOrder(event.row.id, 'Confirmado desde Oficina.');
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
