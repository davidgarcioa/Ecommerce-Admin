import { effect, inject, Injectable, signal } from '@angular/core';

import { AccountStorageService } from '../../../core/services/account-storage.service';
import { DailyOrder } from '../models/daily-order.model';

const IMPORTED_ORDERS_STORAGE_KEY = 'ecommerce-control-center.imported-orders';

@Injectable({ providedIn: 'root' })
export class ImportedOrdersStoreService {
  private readonly accountStorage = inject(AccountStorageService);
  private readonly ordersState = signal<readonly DailyOrder[]>(this.readOrders());

  readonly orders = this.ordersState.asReadonly();

  constructor() {
    effect(() => {
      this.accountStorage.scope();
      this.ordersState.set(this.readOrders());
    });
  }

  replaceOrders(orders: readonly DailyOrder[]): void {
    this.ordersState.set(this.dedupeOrders(orders));
    this.persistOrders();
  }

  upsertOrders(orders: readonly DailyOrder[]): void {
    this.ordersState.set(this.mergeOrders(this.ordersState(), orders));
    this.persistOrders();
  }

  clearOrders(): void {
    this.ordersState.set([]);
    this.accountStorage.removeItem(IMPORTED_ORDERS_STORAGE_KEY);
  }

  private readOrders(): readonly DailyOrder[] {
    try {
      const raw = this.accountStorage.getItem(IMPORTED_ORDERS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as readonly DailyOrder[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistOrders(): void {
    this.accountStorage.setItem(IMPORTED_ORDERS_STORAGE_KEY, JSON.stringify(this.ordersState()));
  }

  private dedupeOrders(orders: readonly DailyOrder[]): readonly DailyOrder[] {
    return this.mergeOrders([], orders);
  }

  private mergeOrders(
    existingOrders: readonly DailyOrder[],
    incomingOrders: readonly DailyOrder[],
  ): readonly DailyOrder[] {
    const byBusinessKey = new Map<string, DailyOrder>();

    existingOrders.forEach((order) => byBusinessKey.set(orderKey(order), order));
    incomingOrders.forEach((order) => {
      const key = orderKey(order);

      byBusinessKey.set(key, order);
    });

    return Array.from(byBusinessKey.values()).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }
}

function orderKey(order: DailyOrder): string {
  return normalizeKey(order.guideNumber || order.orderNumber || order.id);
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}
