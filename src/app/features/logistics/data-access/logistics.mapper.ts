import {
  carrierLabel,
  dispatchStateLabel,
  hasLogisticsIncident,
  hasReturn,
  trackingLabel,
} from '../utils/logistics-status.utils';
import {
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '../../office/utils/order-status.utils';
import { LogisticsOrder, LogisticsOrderListItem } from './logistics.models';

export function toLogisticsOrderListItem(order: LogisticsOrder): LogisticsOrderListItem {
  return {
    ...order,
    deliveryStatusLabel: deliveryStatusLabel(order.deliveryStatus),
    orderStatusLabel: orderStatusLabel(order.orderStatus),
    paymentStatusLabel: paymentStatusLabel(order.paymentStatus),
    carrierLabel: carrierLabel(order.carrier),
    trackingLabel: trackingLabel(order.trackingNumber),
    dispatchStateLabel: dispatchStateLabel(order),
    incidentLabel: hasLogisticsIncident(order) ? 'Con novedad' : 'Sin novedad',
    returnLabel: hasReturn(order) ? 'Con devolucion' : 'Sin devolucion',
  };
}
