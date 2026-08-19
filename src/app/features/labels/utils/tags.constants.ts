import { PermissionCode } from '../../../core/services/permissions.service';
import { TagFilters, TagStatus } from '../data-access/tags.models';

export const TAGS_PERMISSIONS = {
  read: 'tags.read',
  create: 'tags.create',
  update: 'tags.update',
  delete: 'tags.delete',
  archive: 'tags.archive',
  statistics: 'tags.statistics',
} as const satisfies Record<string, PermissionCode>;

export const TAG_STATUS_OPTIONS: readonly {
  readonly value: TagStatus | 'all';
  readonly label: string;
}[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
  { value: 'archived', label: 'Archivadas' },
] as const;

export const TAG_USAGE_OPTIONS: readonly {
  readonly value: TagFilters['usage'];
  readonly label: string;
}[] = [
  { value: 'all', label: 'Todas' },
  { value: 'used', label: 'Con uso' },
  { value: 'unused', label: 'Sin uso' },
] as const;

export const DEFAULT_TAG_FILTERS: TagFilters = {
  status: 'all',
  usage: 'all',
};

export const TAGS_TABLE_PREFERENCES_KEY = 'ecommerce.tags.table.preferences';

export const DEFAULT_TAG_COLOR = '#A1A1A1';
