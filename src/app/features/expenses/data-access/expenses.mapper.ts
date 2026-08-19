import {
  Expense,
  ExpenseCategory,
  ExpenseListItem,
  ExpenseMetadata,
  ExpensePaymentMethod,
  ExpenseStatus,
} from './expenses.models';
import {
  expenseCategoryLabel,
  expensePaymentMethodLabel,
  expenseStatusLabel,
} from '../utils/expenses.formatters';

export function toExpenseListItem(expense: Expense): ExpenseListItem {
  const metadata = readExpenseMetadata(expense.metadata);

  return {
    id: expense.id,
    concept: expense.name,
    description: expense.description ?? '',
    amount: metadata.amount,
    currency: metadata.currency,
    status: metadata.status,
    statusLabel: expenseStatusLabel(metadata.status),
    category: metadata.category,
    categoryLabel: expenseCategoryLabel(metadata.category),
    paymentMethod: metadata.paymentMethod,
    paymentMethodLabel: expensePaymentMethodLabel(metadata.paymentMethod),
    responsible: metadata.responsible,
    supplier: metadata.supplier ?? 'Sin proveedor',
    expenseDate: metadata.expenseDate,
    dueDate: metadata.dueDate ?? '',
    paymentDate: metadata.paymentDate ?? '',
    reference: metadata.reference ?? '',
    hasReceipt: Boolean(metadata.receiptUrl),
    receiptUrl: metadata.receiptUrl ?? '',
    updatedAt: expense.updatedAt,
  };
}

export function readExpenseMetadata(metadata?: Record<string, unknown>): ExpenseMetadata {
  return {
    amount: readNumber(metadata?.['amount'], 0),
    currency: 'COP',
    status: readStatus(metadata?.['status']),
    category: readCategory(metadata?.['category']),
    paymentMethod: readPaymentMethod(metadata?.['paymentMethod']),
    responsible: readString(metadata?.['responsible'], 'Sin responsable'),
    supplier: readOptionalString(metadata?.['supplier']),
    expenseDate: readString(metadata?.['expenseDate'], new Date().toISOString().slice(0, 10)),
    dueDate: readOptionalString(metadata?.['dueDate']),
    paymentDate: readOptionalString(metadata?.['paymentDate']),
    reference: readOptionalString(metadata?.['reference']),
    receiptUrl: readOptionalString(metadata?.['receiptUrl']),
    notes: readOptionalString(metadata?.['notes']),
  };
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readStatus(value: unknown): ExpenseStatus {
  return value === 'paid' || value === 'cancelled' || value === 'pending' ? value : 'pending';
}

function readCategory(value: unknown): ExpenseCategory {
  const categories: readonly ExpenseCategory[] = [
    'advertising',
    'logistics',
    'office',
    'services',
    'supplies',
    'other',
  ];
  return typeof value === 'string' && categories.includes(value as ExpenseCategory)
    ? (value as ExpenseCategory)
    : 'other';
}

function readPaymentMethod(value: unknown): ExpensePaymentMethod {
  const methods: readonly ExpensePaymentMethod[] = [
    'cash',
    'bank-transfer',
    'card',
    'nequi',
    'daviplata',
    'other',
  ];
  return typeof value === 'string' && methods.includes(value as ExpensePaymentMethod)
    ? (value as ExpensePaymentMethod)
    : 'other';
}
