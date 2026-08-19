import { ProductGroupFilters } from '../data-access/product-groups.models';

export const PRODUCT_GROUPS_PERMISSIONS = {
  read: 'product-groups.read',
  create: 'product-groups.create',
  update: 'product-groups.update',
  delete: 'product-groups.delete',
  statistics: 'product-groups.statistics',
  productsRead: 'products.read',
} as const;

export const DEFAULT_PRODUCT_GROUP_FILTERS: ProductGroupFilters = {
  status: 'all',
  featured: 'all',
  rentability: 'all',
};

export const PRODUCT_GROUP_COLOR_OPTIONS = [
  '#8A8A8A',
  '#6F7B8A',
  '#6E8A7A',
  '#8A7C6F',
  '#8A6F6F',
] as const;

export const PRODUCT_GROUP_ICON_OPTIONS = [
  'inventory_2',
  'category',
  'sell',
  'package_2',
  'deployed_code',
] as const;

export const PRODUCT_GROUPS_TABLE_PREFERENCES_KEY = 'product-groups-table-preferences';
