import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/auth-page/auth-page').then((component) => component.AuthPageComponent),
    data: { title: 'Acceso' },
  },
];
