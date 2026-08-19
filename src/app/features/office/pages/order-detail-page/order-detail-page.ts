import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { OrderInfoCardsComponent } from '../../components/order-info-cards/order-info-cards';
import { DeliveryStatus, OrderStatus, PaymentStatus } from '../../data-access/office.models';
import {
  DELIVERY_STATUS_TRANSITIONS,
  OfficeStore,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
} from '../../data-access/office.store';
import { formatDate } from '../../utils/office.formatters';
import {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../utils/order-status.utils';

@Component({
  selector: 'app-order-detail-page',
  imports: [OrderInfoCardsComponent],
  providers: [OfficeStore],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPageComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly store = inject(OfficeStore);
  private readonly router = inject(Router);

  readonly order = this.store.selectedOrder;
  readonly history = this.store.history;
  readonly observations = this.store.observations;
  readonly loading = this.store.loadingDetail;
  readonly saving = this.store.saving;
  readonly changingStatus = this.store.changingStatus;
  readonly error = this.store.error;
  readonly canUpdate = this.store.canUpdateOrders;

  protected readonly formatDate = formatDate;
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly paymentStatusLabel = paymentStatusLabel;
  protected readonly deliveryStatusLabel = deliveryStatusLabel;

  ngOnInit(): void {
    this.store.loadOrderDetail(this.id());
  }

  back(): void {
    void this.router.navigate(['/oficina']);
  }

  edit(): void {
    void this.router.navigate(['/oficina/pedidos', this.id(), 'editar']);
  }

  historyPage(): void {
    void this.router.navigate(['/oficina/pedidos', this.id(), 'historial']);
  }

  confirm(): void {
    this.store.confirmOrder(this.id(), 'Confirmado desde Oficina.');
  }

  nextOrderStatus(): void {
    const order = this.order();
    const next = order ? ORDER_STATUS_TRANSITIONS[order.orderStatus][0] : undefined;
    if (next)
      this.store.updateOrderStatus(this.id(), {
        orderStatus: next,
        notes: 'Cambio desde Oficina.',
      });
  }

  nextPaymentStatus(): void {
    const order = this.order();
    const next = order ? PAYMENT_STATUS_TRANSITIONS[order.paymentStatus][0] : undefined;
    if (next)
      this.store.updatePaymentStatus(this.id(), {
        paymentStatus: next,
        notes: 'Cambio desde Oficina.',
      });
  }

  nextDeliveryStatus(): void {
    const order = this.order();
    const next = order ? DELIVERY_STATUS_TRANSITIONS[order.deliveryStatus][0] : undefined;
    if (next)
      this.store.updateDeliveryStatus(this.id(), {
        deliveryStatus: next,
        notes: 'Cambio desde Oficina.',
      });
  }

  protected orderNextLabel(status: OrderStatus): string {
    const next = ORDER_STATUS_TRANSITIONS[status][0];
    return next ? orderStatusLabel(next) : 'Sin transición';
  }

  protected paymentNextLabel(status: PaymentStatus): string {
    const next = PAYMENT_STATUS_TRANSITIONS[status][0];
    return next ? paymentStatusLabel(next) : 'Sin transición';
  }

  protected deliveryNextLabel(status: DeliveryStatus): string {
    const next = DELIVERY_STATUS_TRANSITIONS[status][0];
    return next ? deliveryStatusLabel(next) : 'Sin transición';
  }
}
