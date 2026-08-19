import {
  Order,
  OrderCustomer,
  OrderDelivery,
  OrderListItem,
  OrderObservation,
  OrderPayment,
  OrderProduct,
} from './office.models';
import {
  confirmationLabel,
  deliveryStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
  priorityLabel,
} from '../utils/order-status.utils';

export function toOrderListItem(order: Order): OrderListItem {
  return {
    ...order,
    orderStatusLabel: orderStatusLabel(order.orderStatus),
    paymentStatusLabel: paymentStatusLabel(order.paymentStatus),
    deliveryStatusLabel: deliveryStatusLabel(order.deliveryStatus),
    priorityLabel: priorityLabel(order),
    confirmationLabel: confirmationLabel(order),
  };
}

export function toOrderCustomer(order: Order): OrderCustomer {
  return {
    id: order.customerId,
    name: order.customerName,
    phone: order.customerPhone,
    email: order.customerEmail,
    city: order.city,
    department: order.department,
    address: order.address,
  };
}

export function toOrderProduct(order: Order): OrderProduct {
  return {
    id: order.productId,
    name: order.productName,
    productGroupId: order.productGroupId,
    productGroupName: order.productGroupName,
    quantity: order.quantity,
    unitPrice: order.quantity > 0 ? order.subtotal / order.quantity : order.subtotal,
    discount: order.discount,
    subtotal: order.subtotal,
  };
}

export function toOrderPayment(order: Order): OrderPayment {
  const paidValue = order.paymentStatus === 'Paid' ? order.total : 0;

  return {
    method: order.paymentMethod,
    status: order.paymentStatus,
    total: order.total,
    paidValue,
    pendingValue: Math.max(order.total - paidValue, 0),
  };
}

export function toOrderDelivery(order: Order): OrderDelivery {
  return {
    address: order.address,
    city: order.city,
    department: order.department,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    status: order.deliveryStatus,
  };
}

export function toOrderObservation(order: Order): OrderObservation | null {
  if (!order.observations?.trim()) {
    return null;
  }

  return {
    id: `${order.id}-observations`,
    author: order.updatedBy ?? order.createdBy,
    content: order.observations,
    createdAt: order.updatedAt,
  };
}
