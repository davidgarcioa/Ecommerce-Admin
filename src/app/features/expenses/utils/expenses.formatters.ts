import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
} from './expenses.constants';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatExpenseCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${value < 0 ? '-' : ''}$${formatMillions(Math.abs(value))}`;
  }

  return currencyFormatter.format(value);
}

function formatMillions(value: number): string {
  const millions = Math.round((value / 1_000_000) * 10) / 10;
  const formatted = Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1);

  return `${formatted}M`;
}

export function formatExpenseDate(value: string): string {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : dateFormatter.format(date);
}

export function expenseStatusLabel(value: string): string {
  return EXPENSE_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? 'Pendiente';
}

export function expenseCategoryLabel(value: string): string {
  return EXPENSE_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? 'Otros';
}

export function expensePaymentMethodLabel(value: string): string {
  return EXPENSE_PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label ?? 'Otro';
}
