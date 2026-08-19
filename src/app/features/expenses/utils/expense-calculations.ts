import { ExpenseListItem, ExpenseSummary } from '../data-access/expenses.models';
import { expenseCategoryLabel } from './expenses.formatters';

export function calculateExpenseSummary(expenses: readonly ExpenseListItem[]): ExpenseSummary {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidAmount = expenses
    .filter((expense) => expense.status === 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const pendingAmount = expenses
    .filter((expense) => expense.status === 'pending')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const withoutReceiptCount = expenses.filter((expense) => !expense.hasReceipt).length;

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    expenseCount: expenses.length,
    averageExpense: expenses.length ? totalAmount / expenses.length : 0,
    topCategoryLabel: resolveTopCategory(expenses),
    withoutReceiptCount,
  };
}

function resolveTopCategory(expenses: readonly ExpenseListItem[]): string {
  if (expenses.length === 0) return 'Sin datos';

  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }

  const [category] = [...totals.entries()].sort((left, right) => right[1] - left[1])[0];
  return expenseCategoryLabel(category);
}
