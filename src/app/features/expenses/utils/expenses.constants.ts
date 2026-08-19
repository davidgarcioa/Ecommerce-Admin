import {
  ExpenseCategory,
  ExpenseFilters,
  ExpensePaymentMethod,
  ExpenseStatus,
} from '../data-access/expenses.models';

export const EXPENSES_TABLE_PREFERENCES_KEY = 'expenses-table-preferences';

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilters = {
  status: 'all',
  category: 'all',
  paymentMethod: 'all',
  receipt: 'all',
  dateFrom: '',
  dateTo: '',
  minAmount: null,
  maxAmount: null,
};

export const EXPENSE_STATUS_OPTIONS: readonly {
  readonly value: ExpenseStatus;
  readonly label: string;
}[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const EXPENSE_CATEGORY_OPTIONS: readonly {
  readonly value: ExpenseCategory;
  readonly label: string;
}[] = [
  { value: 'advertising', label: 'Publicidad' },
  { value: 'logistics', label: 'Logística' },
  { value: 'office', label: 'Oficina' },
  { value: 'services', label: 'Servicios' },
  { value: 'supplies', label: 'Insumos' },
  { value: 'other', label: 'Otros' },
];

export const EXPENSE_PAYMENT_METHOD_OPTIONS: readonly {
  readonly value: ExpensePaymentMethod;
  readonly label: string;
}[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'bank-transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'other', label: 'Otro' },
];
