import { TrackingSearchType } from '../data-access/tracking.models';

export const TRACKING_PERMISSIONS = {
  ordersRead: 'orders.read',
} as const;

export const TRACKING_SEARCH_TYPES: readonly {
  readonly id: TrackingSearchType;
  readonly label: string;
  readonly placeholder: string;
  readonly example: string;
}[] = [
  {
    id: 'order',
    label: 'Pedido',
    placeholder: 'LK-0001',
    example: 'Ejemplo: LK-0001',
  },
  {
    id: 'tracking',
    label: 'Guía',
    placeholder: 'GUIA890001',
    example: 'Ejemplo: GUIA890001',
  },
  {
    id: 'phone',
    label: 'Teléfono',
    placeholder: '+573001112233',
    example: 'Ejemplo: +573001112233',
  },
  {
    id: 'email',
    label: 'Correo',
    placeholder: 'cliente@correo.com',
    example: 'Ejemplo: cliente@correo.com',
  },
  {
    id: 'name',
    label: 'Nombre',
    placeholder: 'Nombre del cliente',
    example: 'Mínimo 3 caracteres',
  },
];

export const TRACKING_RECENT_SEARCHES_KEY = 'tracking_recent_searches';
