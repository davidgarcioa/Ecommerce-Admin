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
import { readExpenseMetadata, toExpenseListItem } from './expenses.mapper';
import { ExpensesApiService } from './expenses-api.service';

const LOCAL_EXPENSES_STORAGE_KEY = 'ecommerce.expenses.local.records';

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
  readonly projectedIncome = computed(() => this.summary().projectedIncome);
  readonly netCashFlow = computed(() => this.summary().netCashFlow);
  readonly budgetAmount = computed(() => this.summary().budgetAmount);
  readonly budgetUsedPercentage = computed(() => this.summary().budgetUsedPercentage);
  readonly paidRatio = computed(() => this.summary().paidRatio);
  readonly pendingCount = computed(() => this.summary().pendingCount);
  readonly overdueAmount = computed(() => this.summary().overdueAmount);
  readonly dueSoonAmount = computed(() => this.summary().dueSoonAmount);
  readonly averageExpense = computed(() => this.summary().averageExpense);
  readonly topCategoryLabel = computed(() => this.summary().topCategoryLabel);
  readonly withoutReceiptCount = computed(() => this.summary().withoutReceiptCount);
  readonly categoryBreakdown = computed(() => this.summary().categoryBreakdown);
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
          const storedExpenses = readStoredExpenses();
          this.replaceExpenses(storedExpenses ?? expenses, false);
        },
        error: () => this.replaceExpenses(readStoredExpenses() ?? [], false),
      });
  }

  loadExpense(id: string): void {
    this.loadingDetailState.set(true);
    this.errorState.set(null);
    this.selectedExpenseState.set(this.findKnownExpense(id));

    this.api
      .getExpense(id)
      .pipe(finalize(() => this.loadingDetailState.set(false)))
      .subscribe({
        next: (expense) => this.selectedExpenseState.set(expense ?? this.findKnownExpense(id)),
        error: () => this.loadLocalExpenseDetail(id),
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
          this.upsertExpense(expense, true);
          onSuccess(expense);
        },
        error: () => {
          const expense = createLocalExpense(payload);

          this.upsertExpense(expense, true);
          onSuccess(expense);
        },
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
          this.upsertExpense(expense, true);
          this.selectedExpenseState.set(expense);
          onSuccess(expense);
        },
        error: () => {
          const expense = updateLocalExpense(this.findKnownExpense(id), payload);

          if (!expense) {
            this.errorState.set('No se encontro el movimiento solicitado.');
            return;
          }

          this.upsertExpense(expense, true);
          this.selectedExpenseState.set(expense);
          onSuccess(expense);
        },
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
          this.removeExpense(id, true);
          onSuccess?.();
        },
        error: () => {
          this.removeExpense(id, true);
          onSuccess?.();
        },
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
    this.sortState.set('expenseDate');
  }

  setSort(sort: ExpenseSortOption): void {
    this.sortState.set(sort);
  }

  setSelectedExpenses(expenses: readonly ExpenseListItem[]): void {
    this.selectedIdsState.set(new Set(expenses.map((expense) => expense.id)));
  }

  private upsertExpense(expense: Expense, persist: boolean): void {
    const workingExpenses = this.resolveWorkingExpenses();
    const nextExpenses = workingExpenses.some((item) => item.id === expense.id)
      ? workingExpenses.map((item) => (item.id === expense.id ? expense : item))
      : [expense, ...workingExpenses];

    this.replaceExpenses(nextExpenses, persist);
  }

  private removeExpense(id: string, persist: boolean): void {
    this.replaceExpenses(
      this.resolveWorkingExpenses().filter((expense) => expense.id !== id),
      persist,
    );

    if (this.selectedExpenseState()?.id === id) this.selectedExpenseState.set(null);
  }

  private replaceExpenses(expenses: readonly Expense[], persist: boolean): void {
    this.expensesState.set(expenses);
    this.errorState.set(null);
    this.lastUpdatedState.set(new Date().toISOString());

    if (persist) persistExpenses(expenses);
  }

  private findKnownExpense(id: string): Expense | null {
    return this.resolveWorkingExpenses().find((expense) => expense.id === id) ?? null;
  }

  private resolveWorkingExpenses(): readonly Expense[] {
    return this.expensesState().length > 0 ? this.expensesState() : (readStoredExpenses() ?? []);
  }

  private loadLocalExpenseDetail(id: string): void {
    const expense = this.findKnownExpense(id);

    this.selectedExpenseState.set(expense);
    this.errorState.set(expense ? null : 'No se encontro el movimiento solicitado.');
    this.loadingDetailState.set(false);
    this.lastUpdatedState.set(new Date().toISOString());
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

function createLocalExpense(payload: CreateExpenseRequest): Expense {
  const now = new Date().toISOString();

  return {
    id: `expense-${toSlug(payload.name)}-${Date.now()}`,
    name: payload.name,
    description: payload.description,
    metadata: { ...payload.metadata },
    createdAt: now,
    updatedAt: now,
  };
}

function updateLocalExpense(
  expense: Expense | null,
  payload: UpdateExpenseRequest,
): Expense | null {
  if (!expense) return null;

  const metadata = payload.metadata
    ? {
        ...readExpenseMetadata(expense.metadata),
        ...payload.metadata,
      }
    : expense.metadata;

  return {
    ...expense,
    name: payload.name ?? expense.name,
    description: 'description' in payload ? payload.description : expense.description,
    metadata,
    updatedAt: new Date().toISOString(),
  };
}

function readStoredExpenses(): readonly Expense[] | null {
  try {
    const rawExpenses = globalThis.localStorage?.getItem(LOCAL_EXPENSES_STORAGE_KEY);

    if (!rawExpenses) return null;

    const parsedExpenses: unknown = JSON.parse(rawExpenses);

    if (!Array.isArray(parsedExpenses)) return null;

    return parsedExpenses.filter(isExpense);
  } catch {
    return null;
  }
}

function persistExpenses(expenses: readonly Expense[]): void {
  try {
    globalThis.localStorage?.setItem(LOCAL_EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    return;
  }
}

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') return false;

  const expense = value as Partial<Expense>;

  return (
    typeof expense.id === 'string' &&
    typeof expense.name === 'string' &&
    typeof expense.createdAt === 'string' &&
    typeof expense.updatedAt === 'string'
  );
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toSlug(value: string): string {
  return (
    normalize(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 42) || 'movimiento'
  );
}

