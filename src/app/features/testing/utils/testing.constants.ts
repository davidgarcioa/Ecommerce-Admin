import { PermissionCode } from '../../../core/services/permissions.service';
import {
  TestingAssociationType,
  TestingFilters,
  TestingStatus,
  TestingType,
} from '../data-access/testing.models';

export const TESTING_PERMISSIONS = {
  read: 'testing.read',
  create: 'testing.create',
  update: 'testing.update',
  delete: 'testing.delete',
  archive: 'testing.archive',
  statistics: 'testing.statistics',
} as const satisfies Record<string, PermissionCode>;

export const TESTING_STATUS_OPTIONS: readonly {
  readonly value: TestingStatus | 'all';
  readonly label: string;
}[] = [
  { value: 'all', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Finalizado' },
  { value: 'archived', label: 'Archivado' },
] as const;

export const TESTING_TYPE_OPTIONS: readonly {
  readonly value: TestingType | 'all';
  readonly label: string;
}[] = [
  { value: 'all', label: 'Todos' },
  { value: 'campaign', label: 'Campana' },
  { value: 'creative', label: 'Creativo' },
  { value: 'product-group', label: 'Conjunto' },
  { value: 'product', label: 'Producto' },
  { value: 'offer', label: 'Oferta' },
  { value: 'operational', label: 'Operativo' },
] as const;

export const TESTING_ASSOCIATION_OPTIONS: readonly {
  readonly value: TestingAssociationType | 'all';
  readonly label: string;
}[] = [
  { value: 'all', label: 'Todas' },
  { value: 'none', label: 'Sin asociacion' },
  { value: 'campaign', label: 'Campana' },
  { value: 'product-group', label: 'Conjunto' },
  { value: 'product', label: 'Producto' },
  { value: 'order', label: 'Pedido' },
] as const;

export const DEFAULT_TESTING_FILTERS: TestingFilters = {
  status: 'all',
  type: 'all',
  associationType: 'all',
};

export const TESTING_TABLE_PREFERENCES_KEY = 'ecommerce.testing.table.preferences';
