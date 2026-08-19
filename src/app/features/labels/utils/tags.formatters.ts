import { DEFAULT_TAG_COLOR, TAG_STATUS_OPTIONS } from './tags.constants';
import { TagStatus } from '../data-access/tags.models';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatTagDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : DATE_FORMATTER.format(date);
}

export function formatTagStatus(status: TagStatus): string {
  return TAG_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Sin estado';
}

export function normalizeTagCode(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toUpperCase()
    .trim();
}

export function normalizeTagName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeTagColor(value: string): string {
  const color = value.trim().toUpperCase();
  return isValidTagColor(color) ? color : '';
}

export function resolveSafeTagColor(value: string | undefined): string {
  return value && isValidTagColor(value) ? value.toUpperCase() : DEFAULT_TAG_COLOR;
}

export function isValidTagColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}
