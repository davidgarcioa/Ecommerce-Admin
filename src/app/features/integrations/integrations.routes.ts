import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/integrations-page/integrations-page').then(
        (component) => component.IntegrationsPageComponent,
      ),
    data: { title: 'Integraciones' },
  },
];
