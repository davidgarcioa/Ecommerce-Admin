import { Injectable } from '@angular/core';

const RESET_VERSION = '2026-08-21-clean-operational-data';
const RESET_MARKER_KEY = 'ecommerce-control-center.operational-reset-version';

const OPERATIONAL_STORAGE_KEYS = [
  'ecommerce-control-center.campaigns.local-records',
  'ecommerce-control-center.imported-orders',
  'ecommerce-control-center.files.import-history',
  'ecommerce.expenses.local.records',
  'ecommerce.product-groups.local.records',
  'ecommerce.tags.local.records',
  'ecommerce.testing.local.records',
] as const;

@Injectable({ providedIn: 'root' })
export class OperationalStorageResetService {
  constructor() {
    this.runOnce();
  }

  private runOnce(): void {
    try {
      const storage = globalThis.localStorage;
      if (!storage || storage.getItem(RESET_MARKER_KEY) === RESET_VERSION) return;

      for (const key of OPERATIONAL_STORAGE_KEYS) {
        storage.removeItem(key);
      }

      storage.setItem(RESET_MARKER_KEY, RESET_VERSION);
    } catch {
      return;
    }
  }
}
