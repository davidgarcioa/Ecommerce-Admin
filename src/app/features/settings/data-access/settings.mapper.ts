import { PermissionCode } from '../../../core/services/permissions.service';
import { formatSettingsDate, permissionGroup, permissionLabel } from '../utils/settings.formatters';
import {
  AdminRole,
  AdminUser,
  PermissionListItem,
  PersistedPermission,
  RoleListItem,
  SettingsProfile,
  UserListItem,
} from './settings.models';

export function toUserListItem(user: AdminUser): UserListItem {
  const pendingApproval = !user.active && user.emailVerified;

  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    username: user.username,
    roleId:
      pendingApproval && user.permissions.length === 0 ? 'Pendiente por asignar' : user.roleId,
    statusLabel: user.active ? 'Activo' : 'Pendiente',
    verificationLabel: user.emailVerified ? 'Correo verificado' : 'Correo pendiente',
    permissionsCount: user.permissions.length,
    lastLogin: formatSettingsDate(user.lastLogin),
  };
}

export function toRoleListItem(role: AdminRole): RoleListItem {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    statusLabel: role.active ? 'Activo' : 'Inactivo',
    permissionsCount: role.permissions.length,
    systemLabel: role.system ? 'Sistema' : 'Personalizado',
    updatedAt: formatSettingsDate(role.updatedAt),
  };
}

export function toPermissionListItem(
  permission: PermissionCode | PersistedPermission,
): PermissionListItem {
  if (typeof permission === 'string') {
    return {
      id: permission,
      code: permission,
      group: permissionGroup(permission),
      name: permissionLabel(permission),
      source: 'system',
    };
  }

  return {
    id: permission.id,
    code: permission.code,
    group: permissionGroup(permission.code),
    name: permission.name,
    source: 'persisted',
  };
}

export function readProfileFromToken(): SettingsProfile | null {
  try {
    const token = localStorage.getItem('ecommerce_access_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as {
      readonly sub?: string;
      readonly email?: string;
      readonly roles?: readonly string[];
      readonly permissions?: readonly PermissionCode[];
    };

    if (!payload.sub || !payload.email) return null;

    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  } catch {
    return null;
  }
}
