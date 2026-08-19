import { TrackingSearchQuery, TrackingSearchType } from '../data-access/tracking.models';

export interface TrackingValidationResult {
  readonly valid: boolean;
  readonly message?: string;
}

export function normalizeTrackingValue(type: TrackingSearchType, value: string): string {
  const trimmed = value.trim();
  return type === 'tracking' ? trimmed.replace(/\s+/g, '') : trimmed;
}

export function validateTrackingSearch(query: TrackingSearchQuery): TrackingValidationResult {
  const value = normalizeTrackingValue(query.type, query.value);
  if (!value) return { valid: false, message: 'Ingresa un valor para buscar.' };

  if (query.type === 'order' && !/^[a-zA-Z0-9-_]{3,40}$/.test(value)) {
    return { valid: false, message: 'El número de pedido no tiene un formato válido.' };
  }

  if (query.type === 'tracking' && !/^[a-zA-Z0-9-]{4,40}$/.test(value)) {
    return { valid: false, message: 'La guía debe ser alfanumérica.' };
  }

  if (query.type === 'phone' && !/^\+?[0-9\s-]{7,20}$/.test(value)) {
    return { valid: false, message: 'El teléfono no tiene un formato válido.' };
  }

  if (query.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { valid: false, message: 'El correo no tiene un formato válido.' };
  }

  if (query.type === 'name' && value.length < 3) {
    return { valid: false, message: 'El nombre debe tener al menos 3 caracteres.' };
  }

  return { valid: true };
}
