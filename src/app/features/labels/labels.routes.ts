import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/labels-page/labels-page').then((m) => m.LabelsPageComponent),
    data: { title: 'Etiquetas' },
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/label-form-page/label-form-page').then((m) => m.LabelFormPageComponent),
    data: { title: 'Nueva etiqueta' },
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/label-form-page/label-form-page').then((m) => m.LabelFormPageComponent),
    data: { title: 'Editar etiqueta' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/label-detail-page/label-detail-page').then((m) => m.LabelDetailPageComponent),
    data: { title: 'Detalle de etiqueta' },
  },
];
