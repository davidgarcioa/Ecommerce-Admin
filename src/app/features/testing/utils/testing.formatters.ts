import {
  TESTING_ASSOCIATION_OPTIONS,
  TESTING_STATUS_OPTIONS,
  TESTING_TYPE_OPTIONS,
} from './testing.constants';
import { TestingAssociationType, TestingStatus, TestingType } from '../data-access/testing.models';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatTestingDate(value: string): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : DATE_FORMATTER.format(date);
}

export function formatTestingStatus(value: TestingStatus): string {
  return TESTING_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? 'Sin estado';
}

export function formatTestingType(value: TestingType): string {
  return TESTING_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? 'Sin tipo';
}

export function formatAssociationType(value: TestingAssociationType): string {
  return TESTING_ASSOCIATION_OPTIONS.find((option) => option.value === value)?.label ?? 'Sin asociacion';
}

export function normalizeTestingCode(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toUpperCase()
    .trim();
}

export function normalizeTestingText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
