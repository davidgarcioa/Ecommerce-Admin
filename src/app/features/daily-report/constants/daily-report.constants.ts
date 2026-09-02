import { Carrier, OrderStatus, PaymentMethod } from '../models/daily-order.model';
import { DailyReportFilter } from '../models/daily-report-filter.model';

export const DAILY_REPORT_DATE = new Date().toISOString().slice(0, 10);

export const PRODUCT_GROUP_OPTIONS = [
  { id: 'all', name: 'Todos' },
  { id: 'sin-conjunto', name: 'Sin conjunto' },
] as const;

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'Pendiente',
  'Confirmada',
  'En preparación',
  'Despachada',
  'En tránsito',
  'Entregada',
  'Devuelta',
  'Cancelada',
] as const;

export const CARRIERS: readonly Carrier[] = [
  'Coordinadora',
  'Servientrega',
  'Inter Rapidísimo',
  'Envía',
  'TCC',
] as const;

export const CITIES: readonly string[] = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Manizales',
] as const;

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'Contraentrega',
  'Transferencia',
  'Tarjeta',
  'PSE',
] as const;

export const DEFAULT_DAILY_REPORT_FILTER: DailyReportFilter = {
  date: DAILY_REPORT_DATE,
  period: 'today',
  dateFrom: null,
  dateTo: null,
  productGroupId: 'all',
  orderStatus: 'Todos',
  carrier: 'Todas',
  city: 'Todas',
};
