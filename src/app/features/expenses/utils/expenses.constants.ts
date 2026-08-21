import {
  ExpenseCategory,
  ExpenseFilters,
  ExpensePaymentMethod,
  ExpenseStatus,
} from '../data-access/expenses.models';

export const EXPENSES_TABLE_PREFERENCES_KEY = 'expenses-table-preferences';

export const FINANCE_MONTHLY_INCOME_TARGET = 78_500_000;

export const EXPENSE_CATEGORY_BUDGETS: Record<ExpenseCategory, number> = {
  advertising: 9_500_000,
  logistics: 6_200_000,
  office: 2_300_000,
  services: 3_800_000,
  supplies: 2_700_000,
  other: 1_500_000,
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  advertising: '#3B82F6',
  logistics: '#10B981',
  office: '#F59E0B',
  services: '#22D3EE',
  supplies: '#8B5CF6',
  other: '#EF4444',
};

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
