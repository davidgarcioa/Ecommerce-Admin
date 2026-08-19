import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tracking-page/tracking-page').then(
        (component) => component.TrackingPageComponent,
      ),
    data: { title: 'Rastreo' },
  },
  {
    path: 'pedido/:orderId',
    loadComponent: () =>
      import('./pages/tracking-detail-page/tracking-detail-page').then(
        (component) => component.TrackingDetailPageComponent,
      ),
    data: { title: 'Rastreo de pedido' },
  },
  {
    path: 'guia/:trackingNumber',
    loadComponent: () =>
      import('./pages/tracking-detail-page/tracking-detail-page').then(
        (component) => component.TrackingDetailPageComponent,
      ),
    data: { title: 'Rastreo de guía' },
  },
  {
    path: 'entrega/:deliveryId',
    loadComponent: () =>
      import('./pages/tracking-detail-page/tracking-detail-page').then(
        (component) => component.TrackingDetailPageComponent,
      ),
    data: { title: 'Rastreo de entrega' },
  },
];
