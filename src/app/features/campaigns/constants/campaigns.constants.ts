import {
  AdvertisingPlatform,
  BudgetType,
  CampaignObjective,
  CampaignStatus,
} from '../models/campaign.model';
import { CampaignFilter } from '../models/campaign-filter.model';

export const CAMPAIGN_STORAGE_KEY = 'ecommerce-control-center.campaigns.local-records';

export const CAMPAIGN_PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last-7-days', label: 'Últimos 7 días' },
  { value: 'last-14-days', label: 'Últimos 14 días' },
  { value: 'last-30-days', label: 'Últimos 30 días' },
  { value: 'this-month', label: 'Este mes' },
  { value: 'previous-month', label: 'Mes anterior' },
  { value: 'custom', label: 'Rango personalizado' },
] as const;

export const CAMPAIGN_STATUSES: readonly CampaignStatus[] = [
  'Activa',
  'Pausada',
  'En revisión',
  'Finalizada',
  'Con errores',
  'Archivada',
];

export const CAMPAIGN_OBJECTIVES: readonly CampaignObjective[] = [
  'Ventas',
  'Tráfico',
  'Interacción',
  'Clientes potenciales',
  'Reconocimiento',
];

export const ADVERTISING_PLATFORMS: readonly AdvertisingPlatform[] = [
  'Facebook',
  'Instagram',
  'Audience Network',
  'Messenger',
  'Varias plataformas',
];

export const BUDGET_TYPES: readonly BudgetType[] = ['Diario', 'Total'];

export const AD_ACCOUNTS = [{ id: 'local-account', name: 'Cuenta local' }] as const;

export const PRODUCT_GROUPS = [
  { id: 'all', name: 'Todos' },
  { id: 'sin-conjunto', name: 'Sin conjunto' },
] as const;

export const PRODUCTS = [{ id: 'all', name: 'Todos', groupId: 'all' }] as const;

export const DEFAULT_CAMPAIGN_FILTER: CampaignFilter = {
  period: 'all',
  adAccountId: 'all',
  campaignStatus: 'Todos',
  objective: 'Todos',
  productGroupId: 'all',
  productId: 'all',
  platform: 'Todas',
  searchTerm: '',
};
