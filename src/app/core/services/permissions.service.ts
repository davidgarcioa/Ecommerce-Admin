import { Injectable, signal } from '@angular/core';

export type PermissionCode =
  | 'dashboard.read'
  | 'dashboard.write'
  | 'product-groups.read'
  | 'product-groups.create'
  | 'product-groups.update'
  | 'product-groups.delete'
  | 'product-groups.statistics'
  | 'products.read'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'products.archive'
  | 'products.restore'
  | 'products.statistics'
  | 'products.profitability'
  | 'products.manage-pricing'
  | 'products.manage-costs'
  | 'products.manage-images'
  | 'products.manage-variants'
  | 'product-categories.read'
  | 'product-categories.manage'
  | 'product-brands.read'
  | 'product-brands.manage'
  | 'orders.read'
  | 'orders.create'
  | 'orders.update'
  | 'orders.delete'
  | 'orders.statistics'
  | 'tags.read'
  | 'tags.create'
  | 'tags.update'
  | 'tags.delete'
  | 'tags.archive'
  | 'tags.statistics'
  | 'testing.read'
  | 'testing.create'
  | 'testing.update'
  | 'testing.delete'
  | 'testing.archive'
  | 'testing.statistics'
  | 'campaigns.read'
  | 'campaigns.write'
  | 'reports.read'
  | 'reports.export'
  | 'files.import'
  | 'users.manage'
  | 'roles.manage'
  | 'settings.manage';

const DEFAULT_PERMISSIONS: readonly PermissionCode[] = [
  'dashboard.read',
  'dashboard.write',
  'product-groups.read',
  'product-groups.create',
  'product-groups.update',
  'product-groups.delete',
  'product-groups.statistics',
  'products.read',
  'products.create',
  'products.update',
  'products.delete',
  'products.archive',
  'products.restore',
  'products.statistics',
  'products.profitability',
  'products.manage-pricing',
  'products.manage-costs',
  'products.manage-images',
  'products.manage-variants',
  'product-categories.read',
  'product-categories.manage',
  'product-brands.read',
  'product-brands.manage',
  'orders.read',
  'orders.create',
  'orders.update',
  'orders.delete',
  'orders.statistics',
  'tags.read',
  'tags.create',
  'tags.update',
  'tags.delete',
  'tags.archive',
  'tags.statistics',
  'testing.read',
  'testing.create',
  'testing.update',
  'testing.delete',
  'testing.archive',
  'testing.statistics',
  'campaigns.read',
  'campaigns.write',
  'reports.read',
  'reports.export',
  'files.import',
  'users.manage',
  'roles.manage',
  'settings.manage',
] as const;

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly permissionsState = signal<readonly PermissionCode[]>(this.readPermissions());

  readonly permissions = this.permissionsState.asReadonly();

  has(permission: PermissionCode): boolean {
    return this.permissionsState().includes(permission);
  }

  hasAny(permissions: readonly PermissionCode[]): boolean {
    return permissions.some((permission) => this.has(permission));
  }

  refreshFromToken(): void {
    this.permissionsState.set(this.readPermissions());
  }

  setPermissions(permissions: readonly string[]): void {
    const nextPermissions = DEFAULT_PERMISSIONS.filter((permission) =>
      permissions.includes(permission),
    );

    try {
      localStorage.setItem('ecommerce_permissions', JSON.stringify(nextPermissions));
    } finally {
      this.permissionsState.set(nextPermissions);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem('ecommerce_permissions');
    } finally {
      this.permissionsState.set([]);
    }
  }

  private readPermissions(): readonly PermissionCode[] {
    try {
      const tokenPermissions = readPermissionsFromToken();
      if (tokenPermissions.length > 0) {
        return tokenPermissions;
      }

      const raw = localStorage.getItem('ecommerce_permissions');
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as readonly string[];
      return DEFAULT_PERMISSIONS.filter((permission) => parsed.includes(permission));
    } catch {
      return [];
    }
  }
}

function readPermissionsFromToken(): readonly PermissionCode[] {
  const token = localStorage.getItem('ecommerce_access_token');
  if (!token) return [];

  try {
    const payload = JSON.parse(decodeJwtPayload(token)) as PermissionTokenPayload;

    if (isAdminPayload(payload)) {
      return DEFAULT_PERMISSIONS;
    }

    return DEFAULT_PERMISSIONS.filter((permission) => payload.permissions?.includes(permission));
  } catch {
    return [];
  }
}

type PermissionRole =
  | string
  | {
      readonly id?: string;
      readonly name?: string;
      readonly code?: string;
      readonly label?: string;
    };

interface PermissionTokenPayload {
  readonly permissions?: readonly string[];
  readonly role?: PermissionRole;
  readonly roleId?: PermissionRole;
  readonly roles?: readonly PermissionRole[];
}

function decodeJwtPayload(token: string): string {
  const encodedPayload = token.split('.')[1] ?? '';
  const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalizedPayload.length % 4)) % 4);

  return atob(`${normalizedPayload}${padding}`);
}

const ADMIN_ROLE_VALUES = new Set([
  'administrador',
  'admin',
  'administrator',
  'superadmin',
  'owner',
  'propietario',
]);

function isAdminPayload(payload: PermissionTokenPayload): boolean {
  const roleValues = [
    ...roleCandidates(payload.role),
    ...roleCandidates(payload.roleId),
    ...(payload.roles ?? []).flatMap((role) => roleCandidates(role)),
  ];

  return roleValues.some((role) => ADMIN_ROLE_VALUES.has(normalizeRole(role)));
}

function roleCandidates(role: PermissionRole | undefined): readonly string[] {
  if (!role) {
    return [];
  }

  if (typeof role === 'string') {
    return [role];
  }

  return [role.id, role.name, role.code, role.label].filter((value): value is string =>
    Boolean(value),
  );
}

function normalizeRole(role: string | undefined): string {
  return (role ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, '');
}
