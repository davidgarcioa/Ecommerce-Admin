import {
  DeliveryStatus,
  Order,
  OrderHistoryItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../office/data-access/office.models';

export type TrackingSearchType = 'order' | 'tracking' | 'phone' | 'email' | 'name';
export type TrackingSource = 'orders' | 'order-history' | 'returns' | 'deliveries';

export interface TrackingSearchQuery {
  readonly type: TrackingSearchType;
  readonly value: string;
}

export interface TrackingOrderSummary {
  readonly id: string;
  readonly orderNumber: string;
  readonly createdAt: string;
  readonly total: number;
  readonly quantity: number;
  readonly productName: string;
  readonly productGroupName: string;
  readonly paymentMethod: PaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly orderStatus: OrderStatus;
}

export interface TrackingCustomerSummary {
  readonly name: string;
  readonly phoneMasked: string;
  readonly emailMasked?: string;
  readonly city: string;
  readonly addressMasked: string;
}

export interface TrackingShipmentSummary {
  readonly carrier?: string;
  readonly trackingNumber?: string;
  readonly deliveryStatus: DeliveryStatus;
  readonly updatedAt: string;
}

export interface TrackingReturnSummary {
  readonly hasReturn: boolean;
  readonly returnId?: string;
  readonly status?: string;
  readonly description?: string;
}

export interface TrackingCurrentStatus {
  readonly label: string;
  readonly description: string;
  readonly date: string;
  readonly hasNovelty: boolean;
  readonly hasReturn: boolean;
}

export interface TrackingEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly source: TrackingSource;
  readonly previousValue?: string;
  readonly nextValue?: string;
  readonly actor?: string;
}

export interface TrackingSearchResult {
  readonly id: string;
  readonly order: TrackingOrderSummary;
  readonly customer: TrackingCustomerSummary;
  readonly shipment: TrackingShipmentSummary;
  readonly currentStatus: TrackingCurrentStatus;
  readonly timeline: readonly TrackingEvent[];
  readonly returnSummary: TrackingReturnSummary;
}

export interface TrackingMetadata {
  readonly partial: boolean;
  readonly warnings: readonly string[];
}

export interface TrackingConsolidatedResult {
  readonly results: readonly TrackingSearchResult[];
  readonly metadata: TrackingMetadata;
}

export interface TrackingRecentSearch {
  readonly type: TrackingSearchType;
  readonly valueMasked: string;
  readonly value?: string;
  readonly searchedAt: string;
}

export interface TrackingOrderSearchResponse {
  readonly data: readonly Order[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export type TrackingOrder = Order;
export type TrackingHistoryItem = OrderHistoryItem;
