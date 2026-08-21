import { toExpenseListItem } from '../data-access/expenses.mapper';
import { expenseFixture } from '../data-access/expenses.fixtures';
import { calculateExpenseSummary } from './expense-calculations';

describe('expense calculations', () => {
  it('calculates totals over the loaded dataset', () => {
    const rows = [
      toExpenseListItem(expenseFixture),
      toExpenseListItem({
        ...expenseFixture,
        id: 'expense-2',
        metadata: {
          ...expenseFixture.metadata,
          amount: 80000,
          status: 'pending',
          receiptUrl: undefined,
          category: 'office',
        },
      }),
    ];

    const summary = calculateExpenseSummary(rows);

    expect(summary.totalAmount).toBe(200000);
    expect(summary.paidAmount).toBe(120000);
    expect(summary.pendingAmount).toBe(80000);
    expect(summary.withoutReceiptCount).toBe(1);
    expect(summary.netCashFlow).toBeGreaterThan(0);
    expect(summary.budgetUsedPercentage).toBeGreaterThan(0);
    expect(summary.categoryBreakdown.length).toBeGreaterThan(0);
  });
});
