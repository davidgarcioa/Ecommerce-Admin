import {
  ExpenseCategory,
  ExpenseCategoryBreakdown,
  ExpenseListItem,
  ExpenseSummary,
} from '../data-access/expenses.models';
import { EXPENSE_CATEGORY_COLORS, EXPENSE_CATEGORY_OPTIONS } from './expenses.constants';
import { expenseCategoryLabel } from './expenses.formatters';

const WEEK_IN_DAYS = 7;

export function calculateExpenseSummary(
  expenses: readonly ExpenseListItem[],
  projectedIncome = 0,
): ExpenseSummary {
  const activeExpenses = expenses.filter((expense) => expense.status !== 'cancelled');
  const totalAmount = activeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = activeExpenses.filter((expense) => expense.status === 'paid');
  const pendingExpenses = activeExpenses.filter((expense) => expense.status === 'pending');
  const paidAmount = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingAmount = pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const withoutReceiptCount = activeExpenses.filter((expense) => !expense.hasReceipt).length;
  const categoryBreakdown = calculateCategoryBreakdown(activeExpenses, totalAmount);

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    projectedIncome,
    netCashFlow: projectedIncome - totalAmount,
    budgetAmount: 0,
    budgetUsedPercentage: 0,
    paidRatio: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
    pendingCount: pendingExpenses.length,
    overdueAmount: calculateDueAmount(pendingExpenses, 'overdue'),
    dueSoonAmount: calculateDueAmount(pendingExpenses, 'soon'),
    expenseCount: activeExpenses.length,
    averageExpense: activeExpenses.length ? totalAmount / activeExpenses.length : 0,
    topCategoryLabel: resolveTopCategory(categoryBreakdown),
    withoutReceiptCount,
    categoryBreakdown,
  };
}

function calculateCategoryBreakdown(
  expenses: readonly ExpenseListItem[],
  totalAmount: number,
): readonly ExpenseCategoryBreakdown[] {
  const rows = new Map<ExpenseCategory, { amount: number; count: number }>();

  for (const expense of expenses) {
    const current = rows.get(expense.category) ?? { amount: 0, count: 0 };
    rows.set(expense.category, {
      amount: current.amount + expense.amount,
      count: current.count + 1,
    });
  }

  return EXPENSE_CATEGORY_OPTIONS.map(({ value: typedCategory }) => {
    const row = rows.get(typedCategory) ?? { amount: 0, count: 0 };
    const percentage = totalAmount > 0 ? (row.amount / totalAmount) * 100 : 0;

    return {
      category: typedCategory,
      label: expenseCategoryLabel(typedCategory),
      amount: row.amount,
      budget: 0,
      count: row.count,
      percentage,
      budgetUsage: percentage,
      color: EXPENSE_CATEGORY_COLORS[typedCategory],
    };
  }).sort((left, right) => right.amount - left.amount);
}

function resolveTopCategory(breakdown: readonly ExpenseCategoryBreakdown[]): string {
  const topCategory = breakdown.find((category) => category.amount > 0);
  return topCategory?.label ?? 'Sin datos';
}

function calculateDueAmount(
  expenses: readonly ExpenseListItem[],
  mode: 'overdue' | 'soon',
): number {
  const today = startOfDay(new Date());

  return expenses
    .filter((expense) => {
      if (!expense.dueDate) return false;

      const dueDate = startOfDay(new Date(`${expense.dueDate}T00:00:00`));
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);

      return mode === 'overdue' ? diffDays < 0 : diffDays >= 0 && diffDays <= WEEK_IN_DAYS;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
