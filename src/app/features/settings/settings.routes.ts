import { Routes } from '@angular/router';

import { permissionGuard } from '../../core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/settings-shell/settings-shell').then((component) => component.SettingsShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'perfil',
      },
      {
        path: 'perfil',
        canMatch: [permissionGuard],
        data: { permissions: ['settings.manage', 'users.manage', 'roles.manage'] },
        loadComponent: () =>
          import('./pages/profile-page/profile-page').then((component) => component.ProfilePageComponent),
      },
      {
        path: 'usuarios',
        canMatch: [permissionGuard],
        data: { permissions: ['users.manage'] },
        loadComponent: () =>
          import('./pages/users-page/users-page').then((component) => component.UsersPageComponent),
      },
      {
        path: 'usuarios/nuevo',
        canMatch: [permissionGuard],
        data: { permissions: ['users.manage'] },
        loadComponent: () =>
          import('./pages/user-form-page/user-form-page').then((component) => component.UserFormPageComponent),
      },
      {
        path: 'usuarios/:id',
        canMatch: [permissionGuard],
        data: { permissions: ['users.manage'] },
        loadComponent: () =>
          import('./pages/user-detail-page/user-detail-page').then((component) => component.UserDetailPageComponent),
      },
      {
        path: 'usuarios/:id/editar',
        canMatch: [permissionGuard],
        data: { permissions: ['users.manage'] },
        loadComponent: () =>
          import('./pages/user-form-page/user-form-page').then((component) => component.UserFormPageComponent),
      },
      {
        path: 'roles',
        canMatch: [permissionGuard],
        data: { permissions: ['roles.manage'] },
        loadComponent: () =>
          import('./pages/roles-page/roles-page').then((component) => component.RolesPageComponent),
      },
      {
        path: 'roles/nuevo',
        canMatch: [permissionGuard],
        data: { permissions: ['roles.manage'] },
        loadComponent: () =>
          import('./pages/role-form-page/role-form-page').then((component) => component.RoleFormPageComponent),
      },
      {
        path: 'roles/:id',
        canMatch: [permissionGuard],
        data: { permissions: ['roles.manage'] },
        loadComponent: () =>
          import('./pages/role-detail-page/role-detail-page').then((component) => component.RoleDetailPageComponent),
      },
      {
        path: 'roles/:id/editar',
        canMatch: [permissionGuard],
        data: { permissions: ['roles.manage'] },
        loadComponent: () =>
          import('./pages/role-form-page/role-form-page').then((component) => component.RoleFormPageComponent),
      },
      {
        path: 'permisos',
        canMatch: [permissionGuard],
        data: { permissions: ['roles.manage'] },
        loadComponent: () =>
          import('./pages/permissions-page/permissions-page').then((component) => component.PermissionsPageComponent),
      },
    ],
  },
];
