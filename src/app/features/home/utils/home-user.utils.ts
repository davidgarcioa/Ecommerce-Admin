import { PermissionCode } from '../../../core/services/permissions.service';
import { HomeUserSummary } from '../data-access/home.models';

export function readHomeUserFromToken(): HomeUserSummary | null {
  try {
    const token = localStorage.getItem('ecommerce_access_token');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as {
      readonly sub?: string;
      readonly email?: string;
      readonly firstName?: string;
      readonly lastName?: string;
      readonly displayName?: string;
      readonly roles?: readonly string[];
      readonly permissions?: readonly PermissionCode[];
    };

    if (!payload.sub || !payload.email) return null;

    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      displayName: payload.displayName,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  } catch {
    return null;
  }
}

export function getDisplayName(user: HomeUserSummary | null): string {
  return resolveUserDisplayName(user);
}

export function resolveUserDisplayName(user: HomeUserSummary | null): string {
  const fromDisplayName = firstValidNamePart(user?.displayName);
  if (fromDisplayName) return normalizeName(fromDisplayName);

  const fromFirstName = firstValidNamePart(user?.firstName);
  if (fromFirstName) return normalizeName(fromFirstName);

  return 'Usuario';
}

export function getUserInitials(user: HomeUserSummary | null): string {
  const name = getDisplayName(user);
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getRoleLabel(user: HomeUserSummary | null): string {
  const role = user?.roles[0];
  if (!role) return 'Perfil operativo';
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/[-_]/g, ' ');
}

function firstValidNamePart(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.includes('@')) return null;

  const [firstPart] = normalized.split(' ');
  if (!firstPart || isTechnicalValue(firstPart)) return null;

  return firstPart;
}

function isTechnicalValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return ['admin', 'administrador', 'undefined', 'null'].includes(normalized);
}

function normalizeName(value: string): string {
  return `${value.charAt(0).toLocaleUpperCase('es-CO')}${value.slice(1)}`;
}
