import { PermissionCode } from '../../../core/services/permissions.service';

export const SETTINGS_PERMISSIONS = {
  settings: 'settings.manage',
  users: 'users.manage',
  roles: 'roles.manage',
} as const satisfies Record<string, PermissionCode>;

export const SETTINGS_TABS: readonly {
  readonly label: string;
  readonly route: string;
  readonly permissions: readonly PermissionCode[];
}[] = [
  { label: 'Perfil', route: '/configuracion/perfil', permissions: ['settings.manage', 'users.manage', 'roles.manage'] },
  { label: 'Usuarios', route: '/configuracion/usuarios', permissions: ['users.manage'] },
  { label: 'Roles', route: '/configuracion/roles', permissions: ['roles.manage'] },
  { label: 'Permisos', route: '/configuracion/permisos', permissions: ['roles.manage'] },
] as const;

export const ROLE_OPTIONS = ['Administrador', 'Supervisor', 'Operador', 'Analista', 'Consulta'] as const;
