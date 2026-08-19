import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Expense } from '../../data-access/expenses.models';
import { toExpenseListItem } from '../../data-access/expenses.mapper';
import { formatExpenseCurrency, formatExpenseDate } from '../../utils/expenses.formatters';

@Component({
  selector: 'app-expense-detail-card',
  templateUrl: './expense-detail-card.html',
  styleUrl: './expense-detail-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseDetailCardComponent {
  readonly expense = input.required<Expense>();
  readonly edit = output<string>();
  readonly delete = output<string>();

  protected readonly item = computed(() => toExpenseListItem(this.expense()));
  protected readonly formatCurrency = formatExpenseCurrency;
  protected readonly formatDate = formatExpenseDate;
}
