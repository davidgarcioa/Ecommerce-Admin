import { PermissionCode } from '../../../core/services/permissions.service';

export interface AdminUser {
  readonly id: string;
  readonly uid: string;
  readonly email: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName?: string;
  readonly avatar?: string;
  readonly phone?: string;
  readonly roleId: string;
  readonly permissions: readonly PermissionCode[];
  readonly active: boolean;
  readonly emailVerified: boolean;
  readonly lastLogin?: string;
}

export interface AdminRole {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly PermissionCode[];
  readonly active: boolean;
  readonly system: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PersistedPermission {
  readonly id: string;
  readonly code: PermissionCode;
  readonly name: string;
  readonly description: string;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SettingsProfile {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly permissions: readonly PermissionCode[];
}

export interface UserListItem {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly username: string;
  readonly roleId: string;
  readonly statusLabel: string;
  readonly verificationLabel: string;
  readonly permissionsCount: number;
  readonly lastLogin: string;
}

export interface RoleListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly statusLabel: string;
  readonly permissionsCount: number;
  readonly systemLabel: string;
  readonly updatedAt: string;
}

export interface PermissionListItem {
  readonly id: string;
  readonly code: PermissionCode;
  readonly group: string;
  readonly name: string;
  readonly source: 'system' | 'persisted';
}

export interface UserFormValue {
  readonly email: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly roleId: string;
  readonly password: string;
  readonly phone: string;
  readonly active: boolean;
  readonly emailVerified: boolean;
  readonly permissions: readonly PermissionCode[];
}

export interface RoleFormValue {
  readonly name: string;
  readonly description: string;
  readonly active: boolean;
  readonly permissions: readonly PermissionCode[];
}

export interface CreateUserRequest extends UserFormValue {}

export interface UpdateUserRequest extends Omit<Partial<UserFormValue>, 'password'> {}

export interface CreateRoleRequest extends RoleFormValue {}

export interface UpdateRoleRequest extends Partial<RoleFormValue> {}
