import { beforeEach, describe, expect, it } from 'vitest';

import {
  getDisplayName,
  getRoleLabel,
  readHomeUserFromToken,
  resolveUserDisplayName,
} from './home-user.utils';

describe('home user utils', () => {
  beforeEach(() => localStorage.clear());

  it('reads the authenticated user from access token', () => {
    const payload = btoa(
      JSON.stringify({
        sub: 'user-1',
        email: 'admin@linkoba.com',
        firstName: 'David',
        lastName: 'Garcia',
        displayName: 'David Garcia',
        roles: ['admin'],
        permissions: ['dashboard.read'],
      }),
    );
    localStorage.setItem('ecommerce_access_token', `header.${payload}.signature`);

    expect(readHomeUserFromToken()).toEqual({
      id: 'user-1',
      email: 'admin@linkoba.com',
      firstName: 'David',
      lastName: 'Garcia',
      displayName: 'David Garcia',
      roles: ['admin'],
      permissions: ['dashboard.read'],
    });
  });

  it('uses displayName as the primary visible name', () => {
    expect(
      resolveUserDisplayName({
        id: 'user-1',
        email: 'servicio.cliente@linkoba.com',
        displayName: 'Maria Fernanda',
        roles: [],
        permissions: [],
      }),
    ).toBe('Maria');
  });

  it('uses firstName when displayName is missing', () => {
    expect(
      getDisplayName({
        id: 'user-1',
        email: 'servicio.cliente@linkoba.com',
        firstName: 'Laura',
        roles: [],
        permissions: [],
      }),
    ).toBe('Laura');
  });

  it('does not derive the visible name from email', () => {
    expect(
      resolveUserDisplayName({
        id: 'user-1',
        email: 'servicio.cliente@linkoba.com',
        roles: [],
        permissions: [],
      }),
    ).toBe('Usuario');
  });

  it('uses a neutral role label when role is missing', () => {
    expect(getRoleLabel(null)).toBe('Perfil operativo');
  });
});
