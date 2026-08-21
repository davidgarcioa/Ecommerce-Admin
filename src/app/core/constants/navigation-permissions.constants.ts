import { PermissionCode } from '../services/permissions.service';

export const NAVIGATION_PERMISSIONS: Readonly<Record<string, readonly PermissionCode[]>> = {
  dashboard: ['dashboard.read'],
  campanas: ['campaigns.read'],
  etiquetas: ['tags.read'],
  testeos: ['testing.read'],
  conjuntos: ['product-groups.read'],
  gastos: ['reports.read'],
  archivos: ['files.import'],
  oficina: ['orders.read'],
  'torre-logistica': ['orders.read'],
  rastreo: ['orders.read'],
  configuracion: ['settings.manage', 'users.manage', 'roles.manage'],
};
