import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { expenseFixture } from './expenses.fixtures';
import { ExpensesApiService } from './expenses-api.service';
import { ExpensesStore } from './expenses.store';

describe('ExpensesStore', () => {
  let store: ExpensesStore;

  beforeEach(() => {
    const apiStub = {
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

  it('loads expenses and computes summary', () => {
    store.loadExpenses();

    expect(store.expenses().length).toBe(1);
    expect(store.totalAmount()).toBe(120000);
    expect(store.paidAmount()).toBe(120000);
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
