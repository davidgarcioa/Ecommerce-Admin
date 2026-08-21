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

export const TAG_COLOR_OPTIONS: readonly {
  readonly value: TagFilters['color'];
  readonly label: string;
  readonly color: string | null;
}[] = [
  { value: 'all', label: 'Todos los colores', color: null },
  { value: '#3B82F6', label: 'Azul', color: '#3B82F6' },
  { value: '#10B981', label: 'Verde', color: '#10B981' },
  { value: '#06B6D4', label: 'Cian', color: '#06B6D4' },
  { value: '#8B5CF6', label: 'Violeta', color: '#8B5CF6' },
  { value: '#F59E0B', label: 'Amarillo', color: '#F59E0B' },
  { value: '#EF4444', label: 'Rojo', color: '#EF4444' },
  { value: '#F97316', label: 'Naranja', color: '#F97316' },
  { value: '#EC4899', label: 'Rosa', color: '#EC4899' },
] as const;

export const DEFAULT_TAG_FILTERS: TagFilters = {
  searchTerm: '',
  status: 'all',
  usage: 'all',
  color: 'all',
};

export const TAGS_TABLE_PREFERENCES_KEY = 'ecommerce.tags.table.preferences';

export const DEFAULT_TAG_COLOR = '#A1A1A1';
