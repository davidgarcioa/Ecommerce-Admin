import { PermissionCode } from '../../../core/services/permissions.service';
import {
  readProfileFromToken,
  toPermissionListItem,
  toRoleListItem,
  toUserListItem,
} from './settings.mapper';
import { AdminRole, AdminUser } from './settings.models';

const permissions: readonly PermissionCode[] = ['dashboard.read', 'users.manage'];

const user: AdminUser = {
  id: 'user-1',
  uid: 'user-1',
  email: 'admin@linkoba.com',
  username: 'admin',
  firstName: 'David',
  lastName: 'Admin',
  roleId: 'role-admin',
  permissions,
  active: true,
  emailVerified: true,
  lastLogin: '2026-07-30T12:00:00.000Z',
};

const role: AdminRole = {
  id: 'role-admin',
  name: 'Administrador',
  description: 'Acceso administrativo',
  permissions,
  active: true,
  system: true,
  createdAt: '2026-07-30T12:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
};

describe('settings mapper', () => {
  afterEach(() => localStorage.clear());

  it('maps users without exposing sensitive fields', () => {
    const item = toUserListItem(user);

    expect(item.name).toBe('David Admin');
    expect(item.statusLabel).toBe('Activo');
    expect(item.verificationLabel).toBe('Correo verificado');
    expect(item.permissionsCount).toBe(2);
  });

  it('maps roles with system label and permission count', () => {
    const item = toRoleListItem(role);

    expect(item.name).toBe('Administrador');
    expect(item.systemLabel).toBe('Sistema');
    expect(item.permissionsCount).toBe(2);
  });

  it('maps system permissions to grouped rows', () => {
    const item = toPermissionListItem('users.manage');

    expect(item.id).toBe('users.manage');
    expect(item.group).toBe('users');
    expect(item.source).toBe('system');
  });

  it('reads profile claims from the access token', () => {
    const payload = btoa(
      JSON.stringify({
        sub: 'user-1',
        email: 'admin@linkoba.com',
        roles: ['Administrador'],
        permissions,
      }),
    );
    localStorage.setItem('ecommerce_access_token', `header.${payload}.signature`);

    expect(readProfileFromToken()).toEqual({
      id: 'user-1',
      email: 'admin@linkoba.com',
      roles: ['Administrador'],
      permissions,
    });
  });
});
