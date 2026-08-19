import { Order, OrderHistoryItem } from '../../office/data-access/office.models';
import { maskAddress, maskEmail, maskPhone } from '../utils/tracking.formatters';
import { trackingStatusDescription } from '../utils/tracking-status.utils';
import {
  TrackingCurrentStatus,
  TrackingEvent,
  TrackingSearchResult,
  TrackingSource,
} from './tracking.models';

export function toTrackingSearchResult(
  order: Order,
  history: readonly OrderHistoryItem[],
): TrackingSearchResult {
  const timeline = toTrackingTimeline(order, history);
  return {
    id: order.id,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: order.total,
      quantity: order.quantity,
      productName: order.productName,
      productGroupName: order.productGroupName,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    },
    customer: {
      name: order.customerName,
      phoneMasked: maskPhone(order.customerPhone),
      emailMasked: maskEmail(order.customerEmail),
      city: order.city,
      addressMasked: maskAddress(order.address),
    },
    shipment: {
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      deliveryStatus: order.deliveryStatus,
      updatedAt: order.updatedAt,
    },
    currentStatus: toCurrentStatus(order, timeline),
    timeline,
    returnSummary: {
      hasReturn: order.orderStatus === 'Returned' || order.deliveryStatus === 'Returned',
      returnId: undefined,
      status: order.deliveryStatus === 'Returned' ? 'Returned' : undefined,
      description:
        order.deliveryStatus === 'Returned'
          ? 'El pedido figura como devuelto en el estado de entrega.'
          : undefined,
    },
  };
}

export function toTrackingTimeline(
  order: Order,
  history: readonly OrderHistoryItem[],
): readonly TrackingEvent[] {
  const created: TrackingEvent = {
    id: `${order.id}-created`,
    title: 'Pedido creado',
    description: `Pedido ${order.orderNumber} registrado.`,
    date: order.createdAt,
    source: 'orders',
  };

  const historyEvents = history.map((item) => toTrackingEvent(item));
  return [...dedupeEvents([created, ...historyEvents])].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function toCurrentStatus(order: Order, timeline: readonly TrackingEvent[]): TrackingCurrentStatus {
  const last = timeline[timeline.length - 1];
  const hasReturn = order.orderStatus === 'Returned' || order.deliveryStatus === 'Returned';
  const hasNovelty = order.deliveryStatus === 'Failed' || order.urgent || hasReturn;

  return {
    label: order.deliveryStatus,
    description: trackingStatusDescription(order.orderStatus, order.deliveryStatus),
    date: last?.date ?? order.updatedAt,
    hasNovelty,
    hasReturn,
  };
}

function toTrackingEvent(item: OrderHistoryItem): TrackingEvent {
  return {
    id: item.id,
    title: historyTitle(item.action),
    description: item.notes || 'Cambio registrado en el pedido.',
    date: item.createdAt,
    source: 'order-history',
    actor: item.changedBy,
    previousValue: stringifyValue(item.previousValue),
    nextValue: stringifyValue(item.nextValue),
  };
}

function historyTitle(action: string): string {
  const titles: Record<string, string> = {
    created: 'Pedido creado',
    updated: 'Pedido actualizado',
    status_changed: 'Estado del pedido actualizado',
    payment_status_changed: 'Estado de pago actualizado',
    delivery_status_changed: 'Estado de entrega actualizado',
    deleted: 'Pedido eliminado',
  };

  return titles[action] ?? 'Evento registrado';
}

function stringifyValue(value?: Record<string, unknown>): string | undefined {
  if (!value) return undefined;
  return Object.entries(value)
    .map(([key, entry]) => `${key}: ${String(entry)}`)
    .join(', ');
}

function dedupeEvents(events: readonly TrackingEvent[]): readonly TrackingEvent[] {
  const map = new Map<string, TrackingEvent>();
  events.forEach((event) => map.set(`${event.source}-${event.id}`, event));
  return [...map.values()];
}

export function sourceLabel(source: TrackingSource): string {
  const labels: Record<TrackingSource, string> = {
    orders: 'Pedidos',
    'order-history': 'Historial de pedido',
    returns: 'Devoluciones',
    deliveries: 'Entregas',
  };
  return labels[source];
}
