import { Routes } from '@angular/router';

import { LEGACY_ROUTE_REDIRECTS } from './core/constants/navigation.constants';
import { authSessionGuard } from './core/guards/auth-session.guard';
import { permissionGuard } from './core/guards/permission.guard';

const legacyRedirectRoutes: Routes = LEGACY_ROUTE_REDIRECTS.map((redirect) => ({
  path: redirect.path,
  pathMatch: 'full',
  redirectTo: redirect.redirectTo,
}));

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then((component) => component.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio',
      },
      {
        path: 'inicio',
        canMatch: [authSessionGuard],
        loadChildren: () => import('./features/home/home.routes').then((m) => m.routes),
        data: { title: 'Inicio' },
      },
      {
        path: 'dashboard',
        canMatch: [permissionGuard],
        data: { permissions: ['dashboard.read'] },
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.routes),
      },
      {
        path: 'campanas',
        canMatch: [permissionGuard],
        data: { permissions: ['campaigns.read'] },
        loadChildren: () => import('./features/campaigns/campaigns.routes').then((m) => m.routes),
      },
      {
        path: 'etiquetas',
        canMatch: [permissionGuard],
        data: { permissions: ['tags.read'] },
        loadChildren: () => import('./features/labels/labels.routes').then((m) => m.routes),
      },
      {
        path: 'testeos',
        canMatch: [permissionGuard],
        data: { permissions: ['testing.read'] },
        loadChildren: () => import('./features/testing/testing.routes').then((m) => m.routes),
      },
      {
        path: 'conjuntos',
        canMatch: [permissionGuard],
        data: { permissions: ['product-groups.read'] },
        loadChildren: () =>
          import('./features/product-groups/product-groups.routes').then((m) => m.routes),
      },
      {
        path: 'gastos',
        canMatch: [permissionGuard],
        data: { permissions: ['reports.read'] },
        loadChildren: () => import('./features/expenses/expenses.routes').then((m) => m.routes),
      },
      {
        path: 'archivos',
        canMatch: [permissionGuard],
        data: { permissions: ['files.import'] },
        loadChildren: () => import('./features/files/files.routes').then((m) => m.routes),
      },
      {
        path: 'integraciones',
        pathMatch: 'full',
        redirectTo: 'archivos/importar',
      },
      {
        path: 'oficina',
        canMatch: [permissionGuard],
        data: { permissions: ['orders.read'] },
        loadChildren: () => import('./features/office/office.routes').then((m) => m.routes),
      },
      {
        path: 'torre-logistica',
        canMatch: [permissionGuard],
        data: { permissions: ['orders.read'] },
        loadChildren: () => import('./features/logistics/logistics.routes').then((m) => m.routes),
      },
      {
        path: 'rastreo',
        canMatch: [permissionGuard],
        data: { permissions: ['orders.read'] },
        loadChildren: () => import('./features/tracking/tracking.routes').then((m) => m.routes),
      },
      {
        path: 'configuracion',
        canMatch: [permissionGuard],
        data: { permissions: ['settings.manage', 'users.manage', 'roles.manage'] },
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.routes),
      },
      ...legacyRedirectRoutes,
      {
        path: 'pagina-no-encontrada',
        loadComponent: () =>
          import('./shared/components/not-found/not-found').then((component) => component.NotFound),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'pagina-no-encontrada',
  },
];
