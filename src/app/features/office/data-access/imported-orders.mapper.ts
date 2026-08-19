import { DailyOrder } from '../../daily-report/models/daily-order.model';
import {
  DeliveryStatus,
  Order,
  OrderStatistics,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './office.models';

const IMPORT_AUTHOR = 'importacion-dropi';

export function toOfficeOrders(orders: readonly DailyOrder[]): readonly Order[] {
  return orders.map(toOfficeOrder);
}

export function toOfficeOrder(order: DailyOrder): Order {
  const deliveryStatus = toDeliveryStatus(order);
  const orderStatus = toOrderStatus(order.status);
  const total = Math.max(0, order.orderValue);
  const shippingCost = Math.max(0, order.shippingCost ?? 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    externalOrderId: order.storeOrderId || order.storeOrderNumber || order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail || undefined,
    city: order.city || 'Sin ciudad',
    department: order.department || 'Sin departamento',
    address: order.address || 'Sin dirección',
    productId: order.productId || order.sku || order.productGroupId,
    productName: order.productName,
    productGroupId: order.productGroupId,
    productGroupName: order.productGroupName,
    quantity: Math.max(1, order.quantity ?? 1),
    subtotal: Math.max(0, total - shippingCost),
    shippingCost,
    discount: 0,
    total,
    currency: 'COP',
    paymentMethod: toPaymentMethod(order.paymentMethod),
    paymentStatus: toPaymentStatus(order, deliveryStatus),
    orderStatus,
    deliveryStatus,
    trackingNumber: order.guideNumber || undefined,
    carrier: order.carrier,
    observations: order.observation || order.notes || order.novelty || undefined,
    urgent: order.urgent,
    source: 'Excel',
    createdBy: IMPORT_AUTHOR,
    updatedBy: IMPORT_AUTHOR,
    metadata: {
      guideStatus: order.guideStatus,
      shippingType: order.shippingType,
      sku: order.sku,
      variation: order.variation,
      novelty: order.novelty,
      noveltySolved: order.noveltySolved,
      lastMovement: order.lastMovement,
      lastMovementConcept: order.lastMovementConcept,
      lastMovementLocation: order.lastMovementLocation,
      providerCost: order.providerCost,
      providerCostTotal: order.providerCostTotal,
      returnShippingCost: order.returnShippingCost,
      commission: order.commission,
      estimatedProfit: order.estimatedProfit,
    },
    createdAt: order.createdAt,
    updatedAt: order.lastUpdated || order.createdAt,
  };
}

export function toOrderStatistics(orders: readonly Order[]): OrderStatistics {
  const totalOrders = orders.length;
  const sales = sum(orders, (order) => order.total);
  const delivered = orders.filter((order) => order.deliveryStatus === 'Delivered').length;
  const inTransit = orders.filter((order) => order.deliveryStatus === 'In Transit').length;
  const cancelled = orders.filter((order) =>
    ['Cancelled', 'Returned', 'Refunded'].includes(order.orderStatus),
  ).length;
  const urgent = orders.filter((order) => order.urgent).length;
  const soldValue = sum(
    orders.filter((order) => order.paymentStatus === 'Paid'),
    (order) => order.total,
  );

  return {
    totalOrders,
    sales,
    averageTicket: totalOrders > 0 ? Math.round(sales / totalOrders) : 0,
    cancelled,
    delivered,
    inTransit,
    urgent,
    soldValue,
    pendingValue: Math.max(0, sales - soldValue),
  };
}

function toOrderStatus(status: DailyOrder['status']): OrderStatus {
  const normalizedStatus = normalizeText(status);

  if (normalizedStatus.includes('confirmada')) return 'Confirmed';
  if (normalizedStatus.includes('preparacion')) return 'Processing';
  if (normalizedStatus.includes('despachada')) return 'Packed';
  if (normalizedStatus.includes('transito')) return 'Shipped';
  if (normalizedStatus.includes('entregada')) return 'Delivered';
  if (normalizedStatus.includes('devuelta')) return 'Returned';
  if (normalizedStatus.includes('cancelada')) return 'Cancelled';
  return 'Pending';
}

function toDeliveryStatus(order: DailyOrder): DeliveryStatus {
  const normalizedGuideStatus = normalizeText(order.guideStatus ?? '');
  const normalizedStatus = normalizeText(order.status);

  if (normalizedGuideStatus.includes('entregada') || normalizedStatus.includes('entregada')) {
    return 'Delivered';
  }
  if (normalizedGuideStatus.includes('devuelta') || normalizedStatus.includes('devuelta')) {
    return 'Returned';
  }
  if (normalizedGuideStatus.includes('cancelada') || normalizedStatus.includes('cancelada')) {
    return 'Failed';
  }
  if (
    normalizedGuideStatus.includes('ruta') ||
    normalizedGuideStatus.includes('transito') ||
    normalizedStatus.includes('transito')
  ) {
    return 'In Transit';
  }
  if (
    normalizedGuideStatus.includes('bodega') ||
    normalizedGuideStatus.includes('despachada') ||
    normalizedStatus.includes('despachada')
  ) {
    return 'Assigned';
  }
  return 'Pending';
}

function toPaymentMethod(paymentMethod: DailyOrder['paymentMethod']): PaymentMethod {
  const normalizedPaymentMethod = normalizeText(paymentMethod);

  if (normalizedPaymentMethod.includes('contra')) return 'Cash on Delivery';
  if (normalizedPaymentMethod.includes('tarjeta')) return 'Card';
  if (normalizedPaymentMethod.includes('pse')) return 'PSE';
  if (normalizedPaymentMethod.includes('transferencia')) return 'Transfer';
  return 'Other';
}

function toPaymentStatus(order: DailyOrder, deliveryStatus: DeliveryStatus): PaymentStatus {
  if (deliveryStatus === 'Delivered' && order.orderValue > 0) return 'Paid';
  if (deliveryStatus === 'Returned') return 'Refunded';
  if (deliveryStatus === 'Failed') return 'Failed';
  return 'Pending';
}

function sum<TItem>(items: readonly TItem[], selector: (item: TItem) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
