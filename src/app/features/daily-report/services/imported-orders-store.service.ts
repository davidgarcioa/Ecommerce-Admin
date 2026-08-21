import { Injectable, signal } from '@angular/core';

import { DailyOrder } from '../models/daily-order.model';

const IMPORTED_ORDERS_STORAGE_KEY = 'ecommerce-control-center.imported-orders';

@Injectable({ providedIn: 'root' })
export class ImportedOrdersStoreService {
  private readonly ordersState = signal<readonly DailyOrder[]>(this.readOrders());

  readonly orders = this.ordersState.asReadonly();

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
    try {
      localStorage.removeItem(IMPORTED_ORDERS_STORAGE_KEY);
    } catch {
      // La aplicación debe seguir funcionando aunque el navegador bloquee localStorage.
    }
  }

  private readOrders(): readonly DailyOrder[] {
    try {
      const raw = localStorage.getItem(IMPORTED_ORDERS_STORAGE_KEY);
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
    try {
      localStorage.setItem(IMPORTED_ORDERS_STORAGE_KEY, JSON.stringify(this.ordersState()));
    } catch {
      // La tabla debe seguir funcionando aunque el navegador bloquee localStorage.
    }
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
      const current = byBusinessKey.get(key);

      byBusinessKey.set(key, current && shouldKeepCurrentOrder(current, order) ? current : order);
    });

    return Array.from(byBusinessKey.values()).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }
}

function orderKey(order: DailyOrder): string {
  return normalizeKey(order.guideNumber || order.orderNumber || order.id);
}

function shouldKeepCurrentOrder(current: DailyOrder | undefined, incoming: DailyOrder): boolean {
  if (!current) return false;

  const currentTime = Date.parse(current.lastUpdated || current.createdAt);
  const incomingTime = Date.parse(incoming.lastUpdated || incoming.createdAt);

  if (Number.isNaN(currentTime) || Number.isNaN(incomingTime)) {
    return false;
  }

  return currentTime > incomingTime;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}
