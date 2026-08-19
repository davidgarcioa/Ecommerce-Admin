import { PermissionCode } from '../../../core/services/permissions.service';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatSettingsDate(value: string | undefined): string {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin registro' : DATE_FORMATTER.format(date);
}

export function permissionGroup(permission: PermissionCode): string {
  return permission.split('.')[0] ?? 'general';
}

export function permissionLabel(permission: PermissionCode): string {
  return permission.replace(/[.-]/g, ' ');
}
