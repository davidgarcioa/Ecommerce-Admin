import { Routes } from '@angular/router';

import { permissionGuard } from '../../core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/settings-shell/settings-shell').then(
        (component) => component.SettingsShellComponent,
      ),
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
          import('./pages/profile-page/profile-page').then(
            (component) => component.ProfilePageComponent,
          ),
      },
      {
        path: '**',
        redirectTo: 'perfil',
      },
    ],
  },
];
