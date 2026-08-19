import { LogisticsFilters } from '../data-access/logistics.models';

export const LOGISTICS_PERMISSIONS = {
  readOrders: 'orders.read',
  updateOrders: 'orders.update',
  statistics: 'orders.statistics',
} as const;

export const DEFAULT_LOGISTICS_FILTERS: LogisticsFilters = {
  orderStatus: 'all',
  deliveryStatus: 'all',
  paymentStatus: 'all',
  carrier: '',
  city: '',
  withoutTracking: false,
  withIncident: false,
  withReturn: false,
  dateFrom: '',
  dateTo: '',
};

export const LOGISTICS_TABLE_PREFERENCES_KEY = 'logistics-orders-table-preferences';

export const LOGISTICS_DELIVERY_STATUS_TRANSITIONS = {
  Pending: ['Assigned', 'Failed'],
  Assigned: ['In Transit', 'Failed'],
  'In Transit': ['Delivered', 'Returned', 'Failed'],
  Delivered: ['Returned'],
  Returned: [],
  Failed: ['Pending'],
} as const;
