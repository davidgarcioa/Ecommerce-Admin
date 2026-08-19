import { DeliveryStatus, OrderStatus } from '../../office/data-access/office.models';
import { deliveryStatusLabel, orderStatusLabel } from '../../office/utils/order-status.utils';

export {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../office/utils/order-status.utils';

export function trackingStatusDescription(
  orderStatus: OrderStatus,
  deliveryStatus: DeliveryStatus,
): string {
  if (deliveryStatus === 'Delivered') return 'El envío figura como entregado.';
  if (deliveryStatus === 'In Transit') return 'El envío está en tránsito con la transportadora.';
  if (deliveryStatus === 'Failed') return 'Hay un intento fallido o novedad de entrega.';
  if (deliveryStatus === 'Returned') return 'El envío figura en devolución.';
  if (orderStatus === 'Confirmed')
    return 'El pedido está confirmado y pendiente de avance logístico.';
  return `Pedido: ${orderStatusLabel(orderStatus)}. Entrega: ${deliveryStatusLabel(deliveryStatus)}.`;
}
