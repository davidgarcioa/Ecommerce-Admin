import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ExpenseFilters, ExpenseSortOption } from '../../data-access/expenses.models';
import {
  DEFAULT_EXPENSE_FILTERS,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
} from '../../utils/expenses.constants';

@Component({
  selector: 'app-expenses-filters',
  imports: [FormsModule],
  templateUrl: './expenses-filters.html',
  styleUrl: './expenses-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesFiltersComponent {
  readonly search = input('');
  readonly filters = input<ExpenseFilters>(DEFAULT_EXPENSE_FILTERS);
  readonly sort = input<ExpenseSortOption>('expenseDate');

  readonly searchChange = output<string>();
  readonly filtersChange = output<ExpenseFilters>();
  readonly sortChange = output<ExpenseSortOption>();
  readonly clear = output<void>();

  protected readonly statuses = EXPENSE_STATUS_OPTIONS;
  protected readonly categories = EXPENSE_CATEGORY_OPTIONS;
  protected readonly paymentMethods = EXPENSE_PAYMENT_METHOD_OPTIONS;

  updateFilter<TKey extends keyof ExpenseFilters>(key: TKey, value: ExpenseFilters[TKey]): void {
    this.filtersChange.emit({ ...this.filters(), [key]: value });
  }
}
