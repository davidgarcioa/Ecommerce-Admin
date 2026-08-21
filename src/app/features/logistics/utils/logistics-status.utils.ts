import { LogisticsDeliveryStatus, LogisticsOrder } from '../data-access/logistics.models';

export {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../office/utils/order-status.utils';

export function carrierLabel(carrier?: string): string {
  return carrier?.trim() ? carrier : 'Sin transportadora';
}

export function trackingLabel(trackingNumber?: string): string {
  return trackingNumber?.trim() ? trackingNumber : 'Sin guia';
}

export function dispatchStateLabel(order: LogisticsOrder): string {
  if (order.deliveryStatus === 'Delivered') return 'Entregado';
  if (order.deliveryStatus === 'In Transit') return 'En transito';
  if (order.trackingNumber?.trim()) return 'Con guia';
  if (order.carrier?.trim()) return 'Transportadora asignada';
  if (order.orderStatus === 'Confirmed' || order.orderStatus === 'Processing') return 'Pendiente';
  return 'No disponible';
}

export function hasLogisticsIncident(order: LogisticsOrder): boolean {
  return order.deliveryStatus === 'Failed' || order.urgent;
}

export function hasReturn(order: LogisticsOrder): boolean {
  return order.orderStatus === 'Returned' || order.deliveryStatus === 'Returned';
}

export function canPrepareDispatch(order: LogisticsOrder): boolean {
  return (
    ['Confirmed', 'Processing', 'Packed'].includes(order.orderStatus) &&
    order.deliveryStatus !== 'Delivered'
  );
}

export function canUpdateDeliveryStatus(status: LogisticsDeliveryStatus): boolean {
  return status !== 'Delivered' && status !== 'Returned';
}
