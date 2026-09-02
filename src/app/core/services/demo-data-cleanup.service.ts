import { Injectable } from '@angular/core';

const CLEANUP_VERSION = '2026-09-02-real-data-only-v1';
const CLEANUP_MARKER_KEY = 'ecommerce-control-center.demo-cleanup-version';

const LOCAL_RECORD_KEYS = [
  'ecommerce-control-center.campaigns.local-records',
  'ecommerce-control-center.imported-orders',
  'ecommerce.expenses.local.records',
  'ecommerce.product-groups.local.records',
  'ecommerce.tags.local.records',
  'ecommerce.testing.local.records',
] as const;

const LEGACY_DEMO_CONTEXT_VALUES = new Set([
  'ecommerce colombia principal',
  'helvor',
  'helvor 2',
  'fondal',
  'fyntra',
  'fyntra 2',
  'gadrix',
  'gadrix 2',
  'halcor',
  'gemvia',
  'validacion oferta helvor',
  'campana helvor',
]);

const LEGACY_DEMO_CUSTOMER_VALUES = new Set([
  'laura mendez',
  'carlos rojas',
  'natalia perez',
  'andres soto',
  'camila torres',
  'felipe gomez',
]);

@Injectable({ providedIn: 'root' })
export class DemoDataCleanupService {
  constructor() {
    this.runOnce();
  }

  private runOnce(): void {
    try {
      const storage = globalThis.localStorage;
      if (!storage || storage.getItem(CLEANUP_MARKER_KEY) === CLEANUP_VERSION) return;

      for (const key of LOCAL_RECORD_KEYS) {
        this.cleanRecordList(storage, key);
      }

      storage.setItem(CLEANUP_MARKER_KEY, CLEANUP_VERSION);
    } catch {
      return;
    }
  }

  private cleanRecordList(storage: Storage, key: string): void {
    const raw = storage.getItem(key);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    const cleaned = parsed.filter((record) => !looksLikeDemoRecord(record));
    if (cleaned.length === parsed.length) return;

    storage.setItem(key, JSON.stringify(cleaned));
  }
}

function looksLikeDemoRecord(record: unknown): boolean {
  if (!record || typeof record !== 'object') return false;

  const identifierValues = [
    readText(record, 'id'),
    readText(record, 'orderNumber'),
    readText(record, 'guideNumber'),
    readText(record, 'trackingNumber'),
  ]
    .filter(Boolean)
    .map(normalize);

  if (identifierValues.some((value) => isDemoIdentifier(value))) return true;

  const contextValues = [
    readText(record, 'name'),
    readText(record, 'productName'),
    readText(record, 'productGroupName'),
    readText(record, 'adAccountName'),
    readText(record, 'description'),
    readNestedText(record, ['association', 'label']),
  ]
    .filter(Boolean)
    .map(normalize);
  const legacyContextCount = contextValues.filter((value) =>
    LEGACY_DEMO_CONTEXT_VALUES.has(value),
  ).length;

  if (legacyContextCount >= 2) return true;

  const customerName = normalize(readText(record, 'customerName'));
  return LEGACY_DEMO_CUSTOMER_VALUES.has(customerName) && legacyContextCount >= 1;
}

function isDemoIdentifier(value: string): boolean {
  return (
    /^demo[-_]/.test(value) ||
    /^(office|logistics|dashboard|tracking|campaign)[-_]demo[-_]/.test(value) ||
    /^lk[-_]?000[1-6]$/.test(value) ||
    /^guia89000[1-6]$/.test(value)
  );
}

function readText(record: object, key: string): string {
  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function readNestedText(record: object, path: readonly string[]): string {
  let current: unknown = record;

  for (const key of path) {
    if (!current || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : '';
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
