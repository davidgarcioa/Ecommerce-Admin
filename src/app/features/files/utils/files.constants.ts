export const FILES_PERMISSION = 'files.import';

export const FILES_TABLE_PREFERENCES_KEY = 'ecommerce.files.table.preferences';

export const DEFAULT_FILE_FILTERS = {
  status: 'all',
  category: 'all',
  visibility: 'all',
} as const;

export const FILE_CATEGORY_LABELS = {
  document: 'Documento',
  image: 'Imagen',
  receipt: 'Recibo',
  evidence: 'Evidencia',
  spreadsheet: 'Hoja de cálculo',
  other: 'Otro',
} as const;

export const FILE_STATUS_LABELS = {
  active: 'Activo',
  archived: 'Archivado',
  deleted: 'Eliminado',
} as const;

export const FILE_VISIBILITY_LABELS = {
  internal: 'Interno',
  restricted: 'Restringido',
} as const;

export const FILE_ENTITY_TYPE_LABELS = {
  campaign: 'Campaña',
  tag: 'Etiqueta',
  testing: 'Testeo',
  'product-group': 'Conjunto',
  expense: 'Gasto',
  order: 'Pedido',
  delivery: 'Entrega',
  return: 'Devolución',
  tracking: 'Rastreo',
  office: 'Oficina',
  general: 'General',
} as const;

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;
