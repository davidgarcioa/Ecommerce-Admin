export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export type DeliveryStatus =
  'Pending' | 'Assigned' | 'In Transit' | 'Delivered' | 'Returned' | 'Failed';

export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Failed' | 'Partial';
export type PaymentMethod = 'Cash on Delivery' | 'Transfer' | 'Card' | 'PSE' | 'Other';
export type OrderSource = 'Manual' | 'Excel' | 'Meta' | 'Store' | 'Dropi';
export type OrderCurrency = 'COP' | 'USD';
export type OrderSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'orderNumber'
  | 'customerName'
  | 'city'
  | 'productName'
  | 'total'
  | 'orderStatus'
  | 'paymentStatus'
  | 'deliveryStatus';
export type SortDirection = 'asc' | 'desc';
export type OfficeActiveView = 'orders' | 'pending';

export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly externalOrderId?: string;
  readonly customerId?: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly customerEmail?: string;
  readonly city: string;
  readonly department: string;
  readonly address: string;
  readonly productId: string;
  readonly productName: string;
  readonly productGroupId: string;
  readonly productGroupName: string;
  readonly quantity: number;
  readonly subtotal: number;
  readonly shippingCost: number;
  readonly discount: number;
  readonly total: number;
  readonly currency: OrderCurrency;
  readonly paymentMethod: PaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly orderStatus: OrderStatus;
  readonly deliveryStatus: DeliveryStatus;
  readonly campaignId?: string;
  readonly campaignName?: string;
  readonly trackingNumber?: string;
  readonly carrier?: string;
  readonly observations?: string;
  readonly urgent: boolean;
  readonly source: OrderSource;
  readonly deletedAt?: string;
  readonly deletedBy?: string;
  readonly createdBy: string;
  readonly updatedBy?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OrderListItem extends Order {
  readonly orderStatusLabel: string;
  readonly paymentStatusLabel: string;
  readonly deliveryStatusLabel: string;
  readonly priorityLabel: string;
  readonly confirmationLabel: string;
}

export type OrderDetail = Order;

export interface OrderCustomer {
  readonly id?: string;
  readonly name: string;
  readonly phone: string;
  readonly email?: string;
  readonly city: string;
  readonly department: string;
  readonly address: string;
}

export interface OrderProduct {
  readonly id: string;
  readonly name: string;
  readonly productGroupId: string;
  readonly productGroupName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount: number;
  readonly subtotal: number;
}

export interface OrderPayment {
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly total: number;
  readonly paidValue: number;
  readonly pendingValue: number;
}

export interface OrderDelivery {
  readonly address: string;
  readonly city: string;
  readonly department: string;
  readonly carrier?: string;
  readonly trackingNumber?: string;
  readonly status: DeliveryStatus;
}

export interface OrderHistoryItem {
  readonly id: string;
  readonly orderId: string;
  readonly action: OrderHistoryAction;
  readonly changedBy: string;
  readonly previousValue?: Record<string, unknown>;
  readonly nextValue?: Record<string, unknown>;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type OrderHistoryAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'payment_status_changed'
  | 'delivery_status_changed'
  | 'deleted';

export interface OrderObservation {
  readonly id: string;
  readonly author: string;
  readonly content: string;
  readonly createdAt: string;
}

export interface OrderStatistics {
  readonly totalOrders: number;
  readonly sales: number;
  readonly averageTicket: number;
  readonly cancelled: number;
  readonly delivered: number;
  readonly inTransit: number;
  readonly urgent: number;
  readonly soldValue: number;
  readonly pendingValue: number;
}

export interface OrderFilters {
  readonly orderStatus: OrderStatus | 'all';
  readonly paymentStatus: PaymentStatus | 'all';
  readonly deliveryStatus: DeliveryStatus | 'all';
  readonly city: string;
  readonly carrier: string;
  readonly urgent: 'all' | 'urgent' | 'standard';
  readonly pendingConfirmation: boolean;
  readonly dateFrom: string;
  readonly dateTo: string;
}

export interface OrderQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy: OrderSortField;
  readonly sortDirection: SortDirection;
  readonly search: string;
  readonly filters: OrderFilters;
}

export interface OrderPagination {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedOrdersResponse {
  readonly data: readonly Order[];
  readonly meta: OrderPagination;
}

export interface UpdateOrderRequest {
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly customerEmail?: string;
  readonly city?: string;
  readonly department?: string;
  readonly address?: string;
  readonly trackingNumber?: string;
  readonly carrier?: string;
  readonly observations?: string;
  readonly urgent?: boolean;
}

export interface UpdateOrderStatusRequest {
  readonly orderStatus: OrderStatus;
  readonly notes?: string;
}

export interface UpdatePaymentStatusRequest {
  readonly paymentStatus: PaymentStatus;
  readonly notes?: string;
}

export interface UpdateDeliveryStatusRequest {
  readonly deliveryStatus: DeliveryStatus;
  readonly notes?: string;
}

export interface AddOrderObservationRequest {
  readonly observations: string;
}

export interface CreateOrderNoveltyRequest {
  readonly notes: string;
}
