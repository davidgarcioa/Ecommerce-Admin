import {
  DeliveryStatus,
  Order,
  OrderHistoryItem,
  OrderPagination,
  OrderQuery,
  OrderSortField,
  OrderStatistics,
  OrderStatus,
  PaymentStatus,
  SortDirection,
  UpdateDeliveryStatusRequest,
  UpdateOrderRequest,
} from '../../office/data-access/office.models';

export type LogisticsOrder = Order;
export type LogisticsHistoryItem = OrderHistoryItem;
export type LogisticsPagination = OrderPagination;
export type LogisticsStatistics = OrderStatistics;
export type LogisticsSortField = OrderSortField;
export type LogisticsSortDirection = SortDirection;
export type LogisticsOrderStatus = OrderStatus;
export type LogisticsDeliveryStatus = DeliveryStatus;
export type LogisticsPaymentStatus = PaymentStatus;
export type UpdateShipmentRequest = Pick<
  UpdateOrderRequest,
  'carrier' | 'trackingNumber' | 'observations'
> & {
  readonly estimatedDeliveryDate?: string;
};
export type UpdateLogisticsDeliveryStatusRequest = UpdateDeliveryStatusRequest;

export interface LogisticsOrderListItem extends LogisticsOrder {
  readonly deliveryStatusLabel: string;
  readonly orderStatusLabel: string;
  readonly paymentStatusLabel: string;
  readonly carrierLabel: string;
  readonly trackingLabel: string;
  readonly dispatchStateLabel: string;
  readonly incidentLabel: string;
  readonly returnLabel: string;
}

export interface LogisticsFilters {
  readonly orderStatus: LogisticsOrderStatus | 'all';
  readonly deliveryStatus: LogisticsDeliveryStatus | 'all';
  readonly paymentStatus: LogisticsPaymentStatus | 'all';
  readonly carrier: string;
  readonly city: string;
  readonly withoutTracking: boolean;
  readonly withIncident: boolean;
  readonly withReturn: boolean;
  readonly dateFrom: string;
  readonly dateTo: string;
}

export interface LogisticsQuery extends Omit<OrderQuery, 'filters'> {
  readonly filters: LogisticsFilters;
}

export interface LogisticsResource {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type DeliveryDetail = LogisticsResource;
export type ReturnDetail = LogisticsResource;
export type LogisticsIncident = LogisticsResource;
export type DispatchDetail = LogisticsOrder;
export type ShipmentDetail = Pick<LogisticsOrder, 'carrier' | 'trackingNumber' | 'deliveryStatus'>;

export interface CarrierInformation {
  readonly carrier?: string;
  readonly trackingNumber?: string;
}

export interface ShippingAddress {
  readonly customerName: string;
  readonly customerPhone: string;
  readonly city: string;
  readonly department: string;
  readonly address: string;
}

export interface DeliveryAttempt {
  readonly id: string;
  readonly createdAt: string;
  readonly result: string;
  readonly notes?: string;
}
