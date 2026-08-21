import {
  HomeModuleSummary,
  HomeOverview,
  HomeStatisticsResponse,
  HomeWorkItem,
} from './home.models';
import { formatHomeNumber } from '../utils/home-date.utils';

export function toHomeOverview(response: HomeStatisticsResponse): HomeOverview {
  return {
    summaries: [
      ...mapOrderSummaries(response.orders),
      ...mapTestingSummaries(response.testing),
      ...mapFileSummaries(response.files),
      ...mapProductGroupSummaries(response.productGroups),
    ].slice(0, 5),
    pendingItems: [
      ...mapOrderPendingItems(response.orders),
      ...mapTestingPendingItems(response.testing),
    ],
    attentionItems: [
      ...mapOrderAttentionItems(response.orders),
      ...mapFileAttentionItems(response.files),
      ...mapTagAttentionItems(response.tags),
    ],
    partialErrors: response.errors,
    loadedAt: new Date().toISOString(),
  };
}

function mapOrderSummaries(
  statistics: HomeStatisticsResponse['orders'],
): readonly HomeModuleSummary[] {
  if (!statistics) return [];
  return [
    {
      id: 'orders-in-transit',
      label: 'En tránsito',
      value: formatHomeNumber(statistics.inTransit),
      description: 'Pedidos con movimiento logístico',
      route: '/torre-logistica',
      icon: 'local_shipping',
    },
    {
      id: 'orders-delivered',
      label: 'Entregados',
      value: formatHomeNumber(statistics.delivered),
      description: 'Pedidos entregados registrados',
      route: '/oficina',
      icon: 'inventory',
    },
  ];
}

function mapTestingSummaries(
  statistics: HomeStatisticsResponse['testing'],
): readonly HomeModuleSummary[] {
  if (!statistics) return [];
  return [
    {
      id: 'testing-active',
      label: 'Testeos activos',
      value: formatHomeNumber(statistics.active),
      description: 'Experimentos en ejecución',
      route: '/testeos',
      icon: 'science',
    },
  ];
}

function mapFileSummaries(
  statistics: HomeStatisticsResponse['files'],
): readonly HomeModuleSummary[] {
  if (!statistics) return [];
  return [
    {
      id: 'files-active',
      label: 'Archivos activos',
      value: formatHomeNumber(statistics.active),
      description: 'Documentos disponibles',
      route: '/archivos',
      icon: 'folder',
    },
  ];
}

function mapProductGroupSummaries(
  statistics: HomeStatisticsResponse['productGroups'],
): readonly HomeModuleSummary[] {
  if (!statistics) return [];
  return [
    {
      id: 'groups-active',
      label: 'Conjuntos activos',
      value: formatHomeNumber(statistics.active),
      description: 'Grupos listos para operar',
      route: '/conjuntos',
      icon: 'inventory_2',
    },
  ];
}

function mapOrderPendingItems(
  statistics: HomeStatisticsResponse['orders'],
): readonly HomeWorkItem[] {
  if (!statistics || statistics.inTransit <= 0) return [];
  return [
    {
      id: 'orders-in-transit',
      kind: 'pending',
      level: 'info',
      title: 'Pedidos en tránsito',
      module: 'Torre Logística',
      description: 'Pedidos en operación logística.',
      route: '/torre-logistica',
      count: statistics.inTransit,
    },
  ];
}

function mapTestingPendingItems(
  statistics: HomeStatisticsResponse['testing'],
): readonly HomeWorkItem[] {
  if (!statistics || statistics.draft <= 0) return [];
  return [
    {
      id: 'testing-draft',
      kind: 'pending',
      level: 'info',
      title: 'Testeos en borrador',
      module: 'Testeos',
      description: 'Experimentos sin iniciar.',
      route: '/testeos',
      count: statistics.draft,
    },
  ];
}

function mapOrderAttentionItems(
  statistics: HomeStatisticsResponse['orders'],
): readonly HomeWorkItem[] {
  if (!statistics || statistics.urgent <= 0) return [];
  return [
    {
      id: 'orders-urgent',
      kind: 'attention',
      level: 'warning',
      title: 'Pedidos urgentes',
      module: 'Oficina',
      description: 'Revisión operativa prioritaria.',
      route: '/oficina',
      count: statistics.urgent,
    },
  ];
}

function mapFileAttentionItems(
  statistics: HomeStatisticsResponse['files'],
): readonly HomeWorkItem[] {
  if (!statistics || statistics.withoutRelation <= 0) return [];
  return [
    {
      id: 'files-without-relation',
      kind: 'attention',
      level: 'info',
      title: 'Archivos sin relación',
      module: 'Archivos',
      description: 'Documentos sin entidad asociada.',
      route: '/archivos',
      count: statistics.withoutRelation,
    },
  ];
}

function mapTagAttentionItems(statistics: HomeStatisticsResponse['tags']): readonly HomeWorkItem[] {
  if (!statistics || statistics.unused <= 0) return [];
  return [
    {
      id: 'tags-unused',
      kind: 'attention',
      level: 'info',
      title: 'Etiquetas sin uso',
      module: 'Etiquetas',
      description: 'Etiquetas sin asociaciones registradas.',
      route: '/etiquetas',
      count: statistics.unused,
    },
  ];
}
