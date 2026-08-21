import { TrackingSearchQuery, TrackingSearchType } from '../data-access/tracking.models';

export interface TrackingValidationResult {
  readonly valid: boolean;
  readonly message?: string;
}

export function normalizeTrackingValue(type: TrackingSearchType, value: string): string {
  const trimmed = value.trim();
  return type === 'tracking' ? trimmed.replace(/\s+/g, '').toUpperCase() : trimmed;
}

export function validateTrackingSearch(query: TrackingSearchQuery): TrackingValidationResult {
  const value = normalizeTrackingValue(query.type, query.value);
  if (!value) return { valid: false, message: 'Ingresa el numero de guia.' };

  if (query.type === 'tracking' && normalizeGuide(value).length < 3) {
    return { valid: false, message: 'Ingresa al menos 3 caracteres de la guia.' };
  }

  if (query.type === 'order' && !/^[a-zA-Z0-9-_]{3,40}$/.test(value)) {
    return { valid: false, message: 'El numero de pedido no tiene un formato valido.' };
  }

  if (query.type === 'phone' && !/^\+?[0-9\s-]{7,20}$/.test(value)) {
    return { valid: false, message: 'El telefono no tiene un formato valido.' };
  }

  if (query.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { valid: false, message: 'El correo no tiene un formato valido.' };
  }

  if (query.type === 'name' && value.length < 3) {
    return { valid: false, message: 'El nombre debe tener al menos 3 caracteres.' };
  }

  return { valid: true };
}

function normalizeGuide(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '');
}
