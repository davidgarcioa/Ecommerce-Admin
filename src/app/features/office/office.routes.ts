import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/office-page/office-page').then((component) => component.OfficePageComponent),
    data: { title: 'Oficina' },
  },
  {
    path: 'pendientes',
    loadComponent: () =>
      import('./pages/pending-orders-page/pending-orders-page').then(
        (component) => component.PendingOrdersPageComponent,
      ),
    data: { title: 'Pedidos pendientes' },
  },
  {
    path: 'pedidos/:id',
    loadComponent: () =>
      import('./pages/order-detail-page/order-detail-page').then(
        (component) => component.OrderDetailPageComponent,
      ),
    data: { title: 'Detalle de pedido' },
  },
  {
    path: 'pedidos/:id/editar',
    loadComponent: () =>
      import('./pages/order-edit-page/order-edit-page').then(
        (component) => component.OrderEditPageComponent,
      ),
    data: { title: 'Editar pedido' },
  },
  {
    path: 'pedidos/:id/historial',
    loadComponent: () =>
      import('./pages/order-history-page/order-history-page').then(
        (component) => component.OrderHistoryPageComponent,
      ),
    data: { title: 'Historial de pedido' },
  },
];
