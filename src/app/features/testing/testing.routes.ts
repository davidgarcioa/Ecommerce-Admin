import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/testing-page/testing-page').then((m) => m.TestingPageComponent),
    data: { title: 'Testeos' },
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/testing-form-page/testing-form-page').then((m) => m.TestingFormPageComponent),
    data: { title: 'Nuevo testeo' },
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/testing-form-page/testing-form-page').then((m) => m.TestingFormPageComponent),
    data: { title: 'Editar testeo' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/testing-detail-page/testing-detail-page').then(
        (m) => m.TestingDetailPageComponent,
      ),
    data: { title: 'Detalle de testeo' },
  },
];
