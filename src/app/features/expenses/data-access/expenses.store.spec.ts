import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { expenseFixture } from './expenses.fixtures';
import { ExpensesApiService } from './expenses-api.service';
import { ExpensesStore } from './expenses.store';

describe('ExpensesStore', () => {
  let store: ExpensesStore;
  let apiStub: {
    listExpenses: ReturnType<typeof vi.fn>;
    getExpense: ReturnType<typeof vi.fn>;
    createExpense: ReturnType<typeof vi.fn>;
    updateExpense: ReturnType<typeof vi.fn>;
    deleteExpense: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    globalThis.localStorage?.clear();

    apiStub = {
      listExpenses: vi.fn(() => of([expenseFixture])),
      getExpense: vi.fn(() => of(expenseFixture)),
      createExpense: vi.fn(() => of(expenseFixture)),
      updateExpense: vi.fn(() => of({ ...expenseFixture, name: 'Editado' })),
      deleteExpense: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [ExpensesStore, { provide: ExpensesApiService, useValue: apiStub }],
    });
    store = TestBed.inject(ExpensesStore);
  });

  afterEach(() => {
    globalThis.localStorage?.clear();
  });

  it('loads expenses and computes summary', () => {
    store.loadExpenses();

    expect(store.expenses().length).toBe(1);
    expect(store.totalAmount()).toBe(120000);
    expect(store.paidAmount()).toBe(120000);
    expect(store.netCashFlow()).toBeGreaterThan(0);
  });

  it('keeps a clean empty state when the API does not respond and no local data exists', () => {
    apiStub.listExpenses.mockReturnValueOnce(throwError(() => new Error('API unavailable')));

    store.loadExpenses();

    expect(store.expenses().length).toBe(0);
    expect(store.error()).toBeNull();
    expect(store.categoryBreakdown().every((category) => category.amount === 0)).toBe(true);
  });

  it('filters by search and clears filters', () => {
    store.loadExpenses();
    store.applySearch('flete');
    expect(store.filteredExpenses().length).toBe(1);

    store.applySearch('sin resultado');
    expect(store.filteredExpenses().length).toBe(0);

    store.clearFilters();
    expect(store.search()).toBe('');
    expect(store.filteredExpenses().length).toBe(1);
  });

  it('loads detail and deletes expense locally', () => {
    store.loadExpenses();
    store.loadExpense('expense-1');
    expect(store.selectedExpense()?.id).toBe('expense-1');

    store.delete('expense-1');
    expect(store.expenses().length).toBe(0);
  });
});
