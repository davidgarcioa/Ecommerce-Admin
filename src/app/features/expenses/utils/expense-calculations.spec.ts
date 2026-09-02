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

    const summary = calculateExpenseSummary(rows, 500000);

    expect(summary.totalAmount).toBe(200000);
    expect(summary.paidAmount).toBe(120000);
    expect(summary.pendingAmount).toBe(80000);
    expect(summary.projectedIncome).toBe(500000);
    expect(summary.netCashFlow).toBe(300000);
    expect(summary.withoutReceiptCount).toBe(1);
    expect(summary.budgetUsedPercentage).toBe(0);
    expect(summary.categoryBreakdown.length).toBeGreaterThan(0);
    expect(summary.categoryBreakdown[0].percentage).toBeGreaterThan(0);
  });
});
