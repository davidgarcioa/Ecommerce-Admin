export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';
export type ExpenseCategory =
  'advertising' | 'logistics' | 'office' | 'services' | 'supplies' | 'other';
export type ExpensePaymentMethod =
  'cash' | 'bank-transfer' | 'card' | 'nequi' | 'daviplata' | 'other';
export type ExpenseSortOption = 'expenseDate' | 'amount' | 'name' | 'updatedAt';

export interface ExpenseMetadata {
  readonly amount: number;
  readonly currency: 'COP';
  readonly status: ExpenseStatus;
  readonly category: ExpenseCategory;
  readonly paymentMethod: ExpensePaymentMethod;
  readonly responsible: string;
  readonly supplier?: string;
  readonly expenseDate: string;
  readonly dueDate?: string;
  readonly paymentDate?: string;
  readonly reference?: string;
  readonly receiptUrl?: string;
  readonly notes?: string;
}

export interface Expense {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ExpenseListItem {
  readonly id: string;
  readonly concept: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: 'COP';
  readonly status: ExpenseStatus;
  readonly statusLabel: string;
  readonly category: ExpenseCategory;
  readonly categoryLabel: string;
  readonly paymentMethod: ExpensePaymentMethod;
  readonly paymentMethodLabel: string;
  readonly responsible: string;
  readonly supplier: string;
  readonly expenseDate: string;
  readonly dueDate: string;
  readonly paymentDate: string;
  readonly reference: string;
  readonly hasReceipt: boolean;
  readonly receiptUrl: string;
  readonly updatedAt: string;
}

export interface ExpenseFilters {
  readonly status: ExpenseStatus | 'all';
  readonly category: ExpenseCategory | 'all';
  readonly paymentMethod: ExpensePaymentMethod | 'all';
  readonly receipt: 'all' | 'with-receipt' | 'without-receipt';
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly minAmount: number | null;
  readonly maxAmount: number | null;
}

export interface ExpenseSummary {
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly pendingAmount: number;
  readonly expenseCount: number;
  readonly averageExpense: number;
  readonly topCategoryLabel: string;
  readonly withoutReceiptCount: number;
}

export interface ExpenseFormValue {
  readonly concept: string;
  readonly description: string;
  readonly amount: number;
  readonly status: ExpenseStatus;
  readonly category: ExpenseCategory;
  readonly paymentMethod: ExpensePaymentMethod;
  readonly responsible: string;
  readonly supplier: string;
  readonly expenseDate: string;
  readonly dueDate: string;
  readonly paymentDate: string;
  readonly reference: string;
  readonly receiptUrl: string;
  readonly notes: string;
}

export interface CreateExpenseRequest {
  readonly name: string;
  readonly description?: string;
  readonly metadata: ExpenseMetadata;
}

export interface UpdateExpenseRequest {
  readonly name?: string;
  readonly description?: string;
  readonly metadata?: ExpenseMetadata;
}
