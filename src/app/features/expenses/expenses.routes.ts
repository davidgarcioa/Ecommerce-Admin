import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/expenses-page/expenses-page').then((m) => m.ExpensesPageComponent),
    data: { title: 'Gastos' },
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/expense-form-page/expense-form-page').then((m) => m.ExpenseFormPageComponent),
    data: { title: 'Nuevo gasto' },
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/expense-form-page/expense-form-page').then((m) => m.ExpenseFormPageComponent),
    data: { title: 'Editar gasto' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/expense-detail-page/expense-detail-page').then(
        (m) => m.ExpenseDetailPageComponent,
      ),
    data: { title: 'Detalle de gasto' },
  },
];
