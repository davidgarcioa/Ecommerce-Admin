import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/campaigns-page/campaigns-page').then((m) => m.CampaignsPageComponent),
    data: { title: 'Campañas', reuse: true },
  },
];
