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
    const byOrderNumber = new Map<string, DailyOrder>();
    orders.forEach((order) => byOrderNumber.set(order.orderNumber, order));

    return Array.from(byOrderNumber.values());
  }
}
