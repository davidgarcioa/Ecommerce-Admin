import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/product-groups-page/product-groups-page').then(
        (m) => m.ProductGroupsPageComponent,
      ),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/product-group-form-page/product-group-form-page').then(
        (m) => m.ProductGroupFormPageComponent,
      ),
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/product-group-form-page/product-group-form-page').then(
        (m) => m.ProductGroupFormPageComponent,
      ),
  },
  {
    path: ':id/productos',
    loadComponent: () =>
      import('./pages/product-group-products-page/product-group-products-page').then(
        (m) => m.ProductGroupProductsPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/product-group-detail-page/product-group-detail-page').then(
        (m) => m.ProductGroupDetailPageComponent,
      ),
  },
];
