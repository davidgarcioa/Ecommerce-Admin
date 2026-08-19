import { OrderFilters } from '../data-access/office.models';

export const OFFICE_PERMISSIONS = {
  read: 'orders.read',
  create: 'orders.create',
  update: 'orders.update',
  delete: 'orders.delete',
  statistics: 'orders.statistics',
} as const;

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  orderStatus: 'all',
  paymentStatus: 'all',
  deliveryStatus: 'all',
  city: '',
  carrier: '',
  urgent: 'all',
  pendingConfirmation: false,
  dateFrom: '',
  dateTo: '',
};

export const ORDER_STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
] as const;

export const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Refunded', 'Failed', 'Partial'] as const;

export const DELIVERY_STATUS_OPTIONS = [
  'Pending',
  'Assigned',
  'In Transit',
  'Delivered',
  'Returned',
  'Failed',
] as const;

export const ORDER_TABLE_PREFERENCES_KEY = 'office-orders-table-preferences';
