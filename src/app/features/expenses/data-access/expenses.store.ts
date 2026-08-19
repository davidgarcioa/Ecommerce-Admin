import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { calculateExpenseSummary } from '../utils/expense-calculations';
import { DEFAULT_EXPENSE_FILTERS } from '../utils/expenses.constants';
import {
  CreateExpenseRequest,
  Expense,
  ExpenseFilters,
  ExpenseListItem,
  ExpenseSortOption,
  UpdateExpenseRequest,
} from './expenses.models';
import { toExpenseListItem } from './expenses.mapper';
import { ExpensesApiService } from './expenses-api.service';

@Injectable()
export class ExpensesStore {
  private readonly api = inject(ExpensesApiService);

  private readonly expensesState = signal<readonly Expense[]>([]);
  private readonly selectedExpenseState = signal<Expense | null>(null);
  private readonly searchState = signal('');
  private readonly filtersState = signal<ExpenseFilters>(DEFAULT_EXPENSE_FILTERS);
  private readonly sortState = signal<ExpenseSortOption>('expenseDate');
  private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set<string>());
  private readonly loadingState = signal(false);
  private readonly loadingDetailState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly lastUpdatedState = signal<string | null>(null);

  readonly expenses = this.expensesState.asReadonly();
  readonly selectedExpense = this.selectedExpenseState.asReadonly();
  readonly search = this.searchState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly sort = this.sortState.asReadonly();
  readonly selectedIds = this.selectedIdsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadingDetail = this.loadingDetailState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly lastUpdated = this.lastUpdatedState.asReadonly();

  readonly listItems = computed(() => this.expensesState().map(toExpenseListItem));
  readonly filteredExpenses = computed(() =>
    sortExpenses(
      this.listItems().filter((expense) =>
        matchesExpense(expense, this.searchState(), this.filtersState()),
      ),
      this.sortState(),
    ),
  );
  readonly summary = computed(() => calculateExpenseSummary(this.filteredExpenses()));
  readonly totalExpenses = computed(() => this.summary().expenseCount);
  readonly totalAmount = computed(() => this.summary().totalAmount);
  readonly paidAmount = computed(() => this.summary().paidAmount);
  readonly pendingAmount = computed(() => this.summary().pendingAmount);
  readonly averageExpense = computed(() => this.summary().averageExpense);
  readonly topCategoryLabel = computed(() => this.summary().topCategoryLabel);
  readonly withoutReceiptCount = computed(() => this.summary().withoutReceiptCount);
  readonly hasExpenses = computed(() => this.expensesState().length > 0);
  readonly hasSelection = computed(() => this.selectedIdsState().size > 0);
  readonly canReadExpenses = computed(() => true);
  readonly canCreateExpense = computed(() => true);
  readonly canUpdateExpense = computed(() => true);
  readonly canDeleteExpense = computed(() => true);
  readonly canViewStatistics = computed(() => true);
  readonly canManageReceipts = computed(() => false);

  loadExpenses(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.api
      .listExpenses()
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (expenses) => {
          this.expensesState.set(expenses);
          this.lastUpdatedState.set(new Date().toISOString());
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  loadExpense(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);

    this.api
      .getExpense(id)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (expense) => this.selectedExpenseState.set(expense),
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  create(payload: CreateExpenseRequest, onSuccess: (expense: Expense) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .createExpense(payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (expense) => {
          this.upsertExpense(expense);
          onSuccess(expense);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  update(id: string, payload: UpdateExpenseRequest, onSuccess: (expense: Expense) => void): void {
    this.savingState.set(true);
    this.errorState.set(null);

    this.api
      .updateExpense(id, payload)
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: (expense) => {
          this.upsertExpense(expense);
          this.selectedExpenseState.set(expense);
          onSuccess(expense);
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  delete(id: string, onSuccess?: () => void): void {
    this.deletingState.set(true);
    this.errorState.set(null);

    this.api
      .deleteExpense(id)
      .pipe(finalize(() => this.deletingState.set(false)))
      .subscribe({
        next: () => {
          this.expensesState.update((expenses) => expenses.filter((expense) => expense.id !== id));
          if (this.selectedExpenseState()?.id === id) {
            this.selectedExpenseState.set(null);
          }
          onSuccess?.();
        },
        error: (error: Error) => this.errorState.set(error.message),
      });
  }

  applySearch(search: string): void {
    this.searchState.set(search);
  }

  applyFilters(filters: ExpenseFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.searchState.set('');
    this.filtersState.set(DEFAULT_EXPENSE_FILTERS);
  }

  setSort(sort: ExpenseSortOption): void {
    this.sortState.set(sort);
  }

  setSelectedExpenses(expenses: readonly ExpenseListItem[]): void {
    this.selectedIdsState.set(new Set(expenses.map((expense) => expense.id)));
  }

  private upsertExpense(expense: Expense): void {
    this.expensesState.update((expenses) =>
      expenses.some((item) => item.id === expense.id)
        ? expenses.map((item) => (item.id === expense.id ? expense : item))
        : [expense, ...expenses],
    );
  }
}

function matchesExpense(
  expense: ExpenseListItem,
  searchValue: string,
  filters: ExpenseFilters,
): boolean {
  const search = normalize(searchValue);
  const searchable = normalize(
    `${expense.concept} ${expense.description} ${expense.responsible} ${expense.supplier} ${expense.reference}`,
  );
  const matchesSearch = !search || searchable.includes(search);
  const matchesStatus = filters.status === 'all' || expense.status === filters.status;
  const matchesCategory = filters.category === 'all' || expense.category === filters.category;
  const matchesPayment =
    filters.paymentMethod === 'all' || expense.paymentMethod === filters.paymentMethod;
  const matchesReceipt =
    filters.receipt === 'all' ||
    (filters.receipt === 'with-receipt' ? expense.hasReceipt : !expense.hasReceipt);
  const matchesDateFrom = !filters.dateFrom || expense.expenseDate >= filters.dateFrom;
  const matchesDateTo = !filters.dateTo || expense.expenseDate <= filters.dateTo;
  const matchesMin = filters.minAmount === null || expense.amount >= filters.minAmount;
  const matchesMax = filters.maxAmount === null || expense.amount <= filters.maxAmount;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesCategory &&
    matchesPayment &&
    matchesReceipt &&
    matchesDateFrom &&
    matchesDateTo &&
    matchesMin &&
    matchesMax
  );
}

function sortExpenses(
  expenses: readonly ExpenseListItem[],
  sort: ExpenseSortOption,
): readonly ExpenseListItem[] {
  return [...expenses].sort((left, right) => {
    switch (sort) {
      case 'amount':
        return right.amount - left.amount;
      case 'name':
        return left.concept.localeCompare(right.concept);
      case 'updatedAt':
        return right.updatedAt.localeCompare(left.updatedAt);
      case 'expenseDate':
        return right.expenseDate.localeCompare(left.expenseDate);
    }
  });
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
