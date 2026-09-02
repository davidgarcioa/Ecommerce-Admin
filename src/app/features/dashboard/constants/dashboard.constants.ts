import { DashboardFilter, DashboardFilterOption } from '../models/dashboard-filter.model';

export const GENERAL_PRODUCT_GROUP_ID = 'general';

export const DASHBOARD_FILTER_STORAGE_KEY = 'ecommerce-control-center.dashboard.filters';

export const DEFAULT_DASHBOARD_FILTER: DashboardFilter = {
  productGroupId: GENERAL_PRODUCT_GROUP_ID,
  period: 'today',
  dateFrom: null,
  dateTo: null,
};

export const DASHBOARD_PERIOD_OPTIONS: readonly DashboardFilterOption[] = [
  { label: 'Hoy', value: 'today' },
  { label: 'Últimos 7 días', value: 'last-7-days' },
  { label: 'Últimos 30 días', value: 'last-30-days' },
  { label: 'Este mes', value: 'this-month' },
] as const;

export const RECENT_ACTIVITY_ITEMS: readonly string[] = [] as const;
