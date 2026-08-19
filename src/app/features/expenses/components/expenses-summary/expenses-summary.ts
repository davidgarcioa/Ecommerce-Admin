import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
  readonly expenseCount = input.required<number>();
  readonly averageExpense = input.required<number>();
  readonly topCategory = input.required<string>();
  readonly withoutReceipt = input.required<number>();
  readonly loading = input(false);

  protected readonly formatCurrency = formatExpenseCurrency;
}
