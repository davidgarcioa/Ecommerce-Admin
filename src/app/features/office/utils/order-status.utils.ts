import { DeliveryStatus, Order, OrderStatus, PaymentStatus } from '../data-access/office.models';

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    Pending: 'Pendiente',
    Confirmed: 'Confirmado',
    Processing: 'En proceso',
    Packed: 'Empacado',
    Shipped: 'Enviado',
    Delivered: 'Entregado',
    Cancelled: 'Cancelado',
    Returned: 'Devuelto',
    Refunded: 'Reembolsado',
  };

  return labels[status];
}

export function paymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    Pending: 'Pendiente',
    Paid: 'Pagado',
    Refunded: 'Reembolsado',
    Failed: 'Fallido',
    Partial: 'Parcial',
  };

  return labels[status];
}

export function deliveryStatusLabel(status: DeliveryStatus): string {
  const labels: Record<DeliveryStatus, string> = {
    Pending: 'Pendiente',
    Assigned: 'Asignado',
    'In Transit': 'En tránsito',
    Delivered: 'Entregado',
    Returned: 'Devuelto',
    Failed: 'Fallido',
  };

  return labels[status];
}

export function priorityLabel(order: Pick<Order, 'urgent'>): string {
  return order.urgent ? 'Urgente' : 'Normal';
}

export function confirmationLabel(order: Pick<Order, 'orderStatus'>): string {
  return order.orderStatus === 'Pending' ? 'Pendiente' : 'Gestionado';
}

export function hasNovelty(
  order: Pick<Order, 'urgent' | 'observations' | 'deliveryStatus'>,
): boolean {
  return order.urgent || Boolean(order.observations?.trim()) || order.deliveryStatus === 'Failed';
}

export function canConfirmOrder(status: OrderStatus): boolean {
  return status === 'Pending';
}
