import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';

import {
  ExpenseCategory,
  ExpenseFilters,
  ExpensePaymentMethod,
  ExpenseSortOption,
  ExpenseStatus,
} from '../../data-access/expenses.models';
import {
  DEFAULT_EXPENSE_FILTERS,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
} from '../../utils/expenses.constants';

type ExpenseSelectKey = 'status' | 'category' | 'paymentMethod' | 'receipt' | 'sort';

interface SelectOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
}

@Component({
  selector: 'app-expenses-filters',
  templateUrl: './expenses-filters.html',
  styleUrl: './expenses-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeSelects()',
    '(keydown.escape)': 'closeSelects()',
  },
})
export class ExpensesFiltersComponent implements OnChanges {
  readonly search = input('');
  readonly filters = input<ExpenseFilters>(DEFAULT_EXPENSE_FILTERS);
  readonly sort = input<ExpenseSortOption>('expenseDate');

  readonly searchChange = output<string>();
  readonly filtersChange = output<ExpenseFilters>();
  readonly sortChange = output<ExpenseSortOption>();
  readonly clear = output<void>();

  readonly currentSearch = signal('');
  readonly currentFilters = signal<ExpenseFilters>(DEFAULT_EXPENSE_FILTERS);
  readonly currentSort = signal<ExpenseSortOption>('expenseDate');
  readonly openSelect = signal<ExpenseSelectKey | null>(null);
  readonly activeFiltersCount = computed(() => {
    const filters = this.currentFilters();

    return (
      Number(this.currentSearch().trim().length > 0) +
      Number(filters.status !== 'all') +
      Number(filters.category !== 'all') +
      Number(filters.paymentMethod !== 'all') +
      Number(filters.receipt !== 'all') +
      Number(Boolean(filters.dateFrom)) +
      Number(Boolean(filters.dateTo)) +
      Number(filters.minAmount !== null) +
      Number(filters.maxAmount !== null) +
      Number(this.currentSort() !== 'expenseDate')
    );
  });

  readonly statusOptions: readonly SelectOption<ExpenseStatus | 'all'>[] = [
    { value: 'all', label: 'Todos' },
    ...EXPENSE_STATUS_OPTIONS,
  ];

  readonly categoryOptions: readonly SelectOption<ExpenseCategory | 'all'>[] = [
    { value: 'all', label: 'Todas' },
    ...EXPENSE_CATEGORY_OPTIONS,
  ];

  readonly paymentMethodOptions: readonly SelectOption<ExpensePaymentMethod | 'all'>[] = [
    { value: 'all', label: 'Todos' },
    ...EXPENSE_PAYMENT_METHOD_OPTIONS,
  ];

  readonly receiptOptions: readonly SelectOption<ExpenseFilters['receipt']>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'with-receipt', label: 'Con soporte' },
    { value: 'without-receipt', label: 'Sin soporte' },
  ];

  readonly sortOptions: readonly SelectOption<ExpenseSortOption>[] = [
    { value: 'expenseDate', label: 'Fecha' },
    { value: 'amount', label: 'Valor' },
    { value: 'name', label: 'Concepto' },
    { value: 'updatedAt', label: 'Actualización' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['search']) this.currentSearch.set(this.search());
    if (changes['filters']) this.currentFilters.set(this.filters());
    if (changes['sort']) this.currentSort.set(this.sort());
  }

  protected onSearchChange(event: Event): void {
    this.currentSearch.set((event.target as HTMLInputElement).value);
  }

  protected onDateChange(key: 'dateFrom' | 'dateTo', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.currentFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  protected onAmountChange(key: 'minAmount' | 'maxAmount', event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.currentFilters.update((filters) => ({
      ...filters,
      [key]: Number.isFinite(value) && value > 0 ? value : null,
    }));
  }

  protected toggleSelect(key: ExpenseSelectKey): void {
    this.openSelect.update((current) => (current === key ? null : key));
  }

  protected closeSelects(): void {
    this.openSelect.set(null);
  }

  protected isSelectOpen(key: ExpenseSelectKey): boolean {
    return this.openSelect() === key;
  }

  protected selectStatus(status: ExpenseStatus | 'all'): void {
    this.currentFilters.update((filters) => ({ ...filters, status }));
    this.closeSelects();
  }

  protected selectCategory(category: ExpenseCategory | 'all'): void {
    this.currentFilters.update((filters) => ({ ...filters, category }));
    this.closeSelects();
  }

  protected selectPaymentMethod(paymentMethod: ExpensePaymentMethod | 'all'): void {
    this.currentFilters.update((filters) => ({ ...filters, paymentMethod }));
    this.closeSelects();
  }

  protected selectReceipt(receipt: ExpenseFilters['receipt']): void {
    this.currentFilters.update((filters) => ({ ...filters, receipt }));
    this.closeSelects();
  }

  protected selectSort(sort: ExpenseSortOption): void {
    this.currentSort.set(sort);
    this.closeSelects();
  }

  protected selectedStatusLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.currentFilters().status)?.label ??
      'Todos'
    );
  }

  protected selectedCategoryLabel(): string {
    return (
      this.categoryOptions.find((option) => option.value === this.currentFilters().category)
        ?.label ?? 'Todas'
    );
  }

  protected selectedPaymentMethodLabel(): string {
    return (
      this.paymentMethodOptions.find(
        (option) => option.value === this.currentFilters().paymentMethod,
      )?.label ?? 'Todos'
    );
  }

  protected selectedReceiptLabel(): string {
    return (
      this.receiptOptions.find((option) => option.value === this.currentFilters().receipt)?.label ??
      'Todos'
    );
  }

  protected selectedSortLabel(): string {
    return this.sortOptions.find((option) => option.value === this.currentSort())?.label ?? 'Fecha';
  }

  protected onApply(): void {
    this.searchChange.emit(this.currentSearch());
    this.filtersChange.emit(this.currentFilters());
    this.sortChange.emit(this.currentSort());
  }

  protected onClear(): void {
    this.currentSearch.set('');
    this.currentFilters.set(DEFAULT_EXPENSE_FILTERS);
    this.currentSort.set('expenseDate');
    this.clear.emit();
  }
}
