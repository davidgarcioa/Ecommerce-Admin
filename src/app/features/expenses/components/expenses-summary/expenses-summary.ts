import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ExpenseCategoryBreakdown } from '../../data-access/expenses.models';
import { formatExpenseCurrency } from '../../utils/expenses.formatters';

@Component({
  selector: 'app-expenses-summary',
  templateUrl: './expenses-summary.html',
  styleUrl: './expenses-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesSummaryComponent {
  readonly totalAmount = input.required<number>();
  readonly paidAmount = input.required<number>();
  readonly pendingAmount = input.required<number>();
  readonly projectedIncome = input.required<number>();
  readonly netCashFlow = input.required<number>();
  readonly budgetAmount = input.required<number>();
  readonly budgetUsedPercentage = input.required<number>();
  readonly paidRatio = input.required<number>();
  readonly pendingCount = input.required<number>();
  readonly overdueAmount = input.required<number>();
  readonly dueSoonAmount = input.required<number>();
  readonly expenseCount = input.required<number>();
  readonly averageExpense = input.required<number>();
  readonly topCategory = input.required<string>();
  readonly withoutReceipt = input.required<number>();
  readonly categoryBreakdown = input.required<readonly ExpenseCategoryBreakdown[]>();
  readonly loading = input(false);

  protected readonly formatCurrency = formatExpenseCurrency;

  protected formatPercentage(value: number): string {
    return `${new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value)} %`;
  }

  protected clamp(value: number): number {
    return Math.max(0, Math.min(value, 100));
  }
}
