import { PermissionCode } from '../../../core/services/permissions.service';

export const SETTINGS_PERMISSIONS = {
  settings: 'settings.manage',
  users: 'users.manage',
  roles: 'roles.manage',
} as const satisfies Record<string, PermissionCode>;

export const ROLE_OPTIONS = [
  'Administrador',
  'Supervisor',
  'Operador',
  'Analista',
  'Consulta',
] as const;
