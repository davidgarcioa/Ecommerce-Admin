import { TestBed } from '@angular/core/testing';

import { PermissionsService } from './permissions.service';

function createToken(permissions: readonly string[]): string {
  return `header.${btoa(JSON.stringify({ permissions }))}.signature`;
}

function createRoleToken(role: string, permissions: readonly string[]): string {
  return `header.${btoa(JSON.stringify({ roles: [role], permissions }))}.signature`;
}

describe('PermissionsService', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('reads permissions from JWT claims first', () => {
    localStorage.setItem('ecommerce_access_token', createToken(['users.manage']));
    localStorage.setItem('ecommerce_permissions', JSON.stringify(['dashboard.read']));

    const service = TestBed.inject(PermissionsService);

    expect(service.has('users.manage')).toBe(true);
    expect(service.has('dashboard.read')).toBe(false);
  });

  it('falls back to stored permissions when no token exists', () => {
    localStorage.setItem('ecommerce_permissions', JSON.stringify(['dashboard.read']));

    const service = TestBed.inject(PermissionsService);

    expect(service.has('dashboard.read')).toBe(true);
    expect(service.has('users.manage')).toBe(false);
  });

  it('does not grant permissions by default', () => {
    const service = TestBed.inject(PermissionsService);

    expect(service.permissions()).toEqual([]);
  });

  it('grants all application permissions to administrator tokens', () => {
    localStorage.setItem(
      'ecommerce_access_token',
      createRoleToken('Administrador', ['dashboard.read']),
    );

    const service = TestBed.inject(PermissionsService);

    expect(service.has('dashboard.read')).toBe(true);
    expect(service.has('campaigns.read')).toBe(true);
    expect(service.has('settings.manage')).toBe(true);
  });
});
