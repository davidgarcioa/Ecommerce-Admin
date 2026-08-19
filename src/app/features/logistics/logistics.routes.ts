import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/logistics-tower-page/logistics-tower-page').then(
        (component) => component.LogisticsTowerPageComponent,
      ),
    data: { title: 'Torre Logística' },
  },
  {
    path: 'pendientes',
    loadComponent: () =>
      import('./pages/pending-dispatches-page/pending-dispatches-page').then(
        (component) => component.PendingDispatchesPageComponent,
      ),
    data: { title: 'Pendientes de despacho' },
  },
  {
    path: 'despachos',
    loadComponent: () =>
      import('./pages/pending-dispatches-page/pending-dispatches-page').then(
        (component) => component.PendingDispatchesPageComponent,
      ),
    data: { title: 'Despachos' },
  },
  {
    path: 'despachos/:id',
    loadComponent: () =>
      import('./pages/dispatch-detail-page/dispatch-detail-page').then(
        (component) => component.DispatchDetailPageComponent,
      ),
    data: { title: 'Detalle logístico' },
  },
  {
    path: 'envios/:id',
    loadComponent: () =>
      import('./pages/dispatch-detail-page/dispatch-detail-page').then(
        (component) => component.DispatchDetailPageComponent,
      ),
    data: { title: 'Información de envío' },
  },
  {
    path: 'entregas',
    loadComponent: () =>
      import('./pages/deliveries-page/deliveries-page').then(
        (component) => component.DeliveriesPageComponent,
      ),
    data: { title: 'Entregas' },
  },
  {
    path: 'devoluciones',
    loadComponent: () =>
      import('./pages/returns-page/returns-page').then(
        (component) => component.ReturnsPageComponent,
      ),
    data: { title: 'Devoluciones' },
  },
  {
    path: 'devoluciones/:id',
    loadComponent: () =>
      import('./pages/return-detail-page/return-detail-page').then(
        (component) => component.ReturnDetailPageComponent,
      ),
    data: { title: 'Detalle de devolución' },
  },
  {
    path: 'incidencias',
    loadComponent: () =>
      import('./pages/incidents-page/incidents-page').then(
        (component) => component.IncidentsPageComponent,
      ),
    data: { title: 'Incidencias' },
  },
  {
    path: 'incidencias/:id',
    loadComponent: () =>
      import('./pages/incident-detail-page/incident-detail-page').then(
        (component) => component.IncidentDetailPageComponent,
      ),
    data: { title: 'Detalle de incidencia' },
  },
];
