import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import {
  TableAction,
  TableActionClick,
} from '../../../../shared/components/data-table/models/table-action.model';
import { TableColumn } from '../../../../shared/components/data-table/models/table-column.model';
import { ExpensesFiltersComponent } from '../../components/expenses-filters/expenses-filters';
import { ExpensesHeaderComponent } from '../../components/expenses-header/expenses-header';
import { ExpensesSummaryComponent } from '../../components/expenses-summary/expenses-summary';
import {
  ExpenseFilters,
  ExpenseListItem,
  ExpenseSortOption,
} from '../../data-access/expenses.models';
import { ExpensesStore } from '../../data-access/expenses.store';
import { EXPENSES_TABLE_PREFERENCES_KEY } from '../../utils/expenses.constants';
import { formatExpenseCurrency, formatExpenseDate } from '../../utils/expenses.formatters';

@Component({
  selector: 'app-expenses-page',
  imports: [
    ExpensesHeaderComponent,
    ExpensesSummaryComponent,
    ExpensesFiltersComponent,
    DataTableComponent,
  ],
  providers: [ExpensesStore],
  templateUrl: './expenses-page.html',
  styleUrl: './expenses-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesPageComponent implements OnInit {
  private readonly store = inject(ExpensesStore);
  private readonly router = inject(Router);

  readonly expenses = this.store.filteredExpenses;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly search = this.store.search;
  readonly filters = this.store.filters;
  readonly sort = this.store.sort;
  readonly lastUpdated = this.store.lastUpdated;
  readonly totalAmount = this.store.totalAmount;
  readonly paidAmount = this.store.paidAmount;
  readonly pendingAmount = this.store.pendingAmount;
  readonly totalExpenses = this.store.totalExpenses;
  readonly averageExpense = this.store.averageExpense;
  readonly topCategoryLabel = this.store.topCategoryLabel;
  readonly withoutReceiptCount = this.store.withoutReceiptCount;
  readonly preferencesKey = EXPENSES_TABLE_PREFERENCES_KEY;

  readonly columns = computed<readonly TableColumn<ExpenseListItem>[]>(() => [
    {
      key: 'expenseDate',
      label: 'Fecha',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '8rem',
      align: 'left',
      formatter: (value) => formatExpenseDate(String(value)),
    },
    {
      key: 'concept',
      label: 'Concepto',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '14rem',
      align: 'left',
    },
    {
      key: 'categoryLabel',
      label: 'Categoría',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '8rem',
      align: 'left',
    },
    {
      key: 'supplier',
      label: 'Proveedor',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '10rem',
      align: 'left',
    },
    {
      key: 'paymentMethodLabel',
      label: 'Método',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '9rem',
      align: 'left',
    },
    {
      key: 'responsible',
      label: 'Responsable',
      type: 'text',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '10rem',
      align: 'left',
    },
    {
      key: 'amount',
      label: 'Valor',
      type: 'currency',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '9rem',
      align: 'right',
      formatter: (value) => formatExpenseCurrency(Number(value)),
    },
    {
      key: 'statusLabel',
      label: 'Estado',
      type: 'status',
      sortable: true,
      searchable: true,
      visible: true,
      minWidth: '8rem',
      align: 'left',
    },
    {
      key: 'hasReceipt',
      label: 'Comprobante',
      type: 'boolean',
      sortable: true,
      searchable: false,
      visible: true,
      align: 'center',
      formatter: (value) => (value ? 'Sí' : 'No'),
    },
    {
      key: 'updatedAt',
      label: 'Actualización',
      type: 'date',
      sortable: true,
      searchable: false,
      visible: true,
      minWidth: '8rem',
      align: 'left',
      formatter: (value) => formatExpenseDate(String(value).slice(0, 10)),
    },
  ]);

  readonly rowActions = computed<readonly TableAction<ExpenseListItem>[]>(() => [
    { id: 'view', label: 'Ver detalle', icon: 'visibility', variant: 'default' },
    { id: 'edit', label: 'Editar', icon: 'edit', variant: 'default' },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      variant: 'danger',
      confirmationRequired: true,
      confirmationMessage: '¿Eliminar este gasto? El backend actual realiza eliminación física.',
    },
  ]);

  ngOnInit(): void {
    this.store.loadExpenses();
  }

  create(): void {
    void this.router.navigate(['/gastos/nuevo']);
  }

  refresh(): void {
    this.store.loadExpenses();
  }

  applySearch(search: string): void {
    this.store.applySearch(search);
  }

  applyFilters(filters: ExpenseFilters): void {
    this.store.applyFilters(filters);
  }

  setSort(sort: ExpenseSortOption): void {
    this.store.setSort(sort);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  openExpense(expense: ExpenseListItem): void {
    void this.router.navigate(['/gastos', expense.id]);
  }

  onAction(event: TableActionClick<ExpenseListItem>): void {
    if (event.action.id === 'view') this.openExpense(event.row);
    if (event.action.id === 'edit') void this.router.navigate(['/gastos', event.row.id, 'editar']);
    if (event.action.id === 'delete') this.store.delete(event.row.id);
  }
}
