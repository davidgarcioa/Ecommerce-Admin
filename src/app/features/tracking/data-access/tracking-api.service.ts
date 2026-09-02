import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';

import { API_CONFIG, isStaticFrontendApi } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { DailyOrder } from '../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../daily-report/services/imported-orders-store.service';
import {
  DeliveryStatus,
  Order,
  OrderHistoryItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../office/data-access/office.models';
import { trackingStatusDescription } from '../utils/tracking-status.utils';
import { normalizeTrackingValue } from '../utils/tracking.validators';
import { toTrackingSearchResult } from './tracking.mapper';
import {
  TrackingConsolidatedResult,
  TrackingEvent,
  TrackingOrderSearchResponse,
  TrackingSearchQuery,
  TrackingSearchResult,
} from './tracking.models';

@Injectable({ providedIn: 'root' })
export class TrackingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);
  private readonly ordersUrl = `${this.apiConfig.baseUrl}/orders`;

  search(query: TrackingSearchQuery): Observable<TrackingConsolidatedResult> {
    const importedMatches = searchImportedOrders(query, this.importedOrdersStore.orders());
    if (importedMatches.length > 0) {
      return of({
        results: importedMatches.map(toImportedTrackingResult),
        metadata: { partial: false, warnings: [] },
      });
    }

    if (isStaticFrontendApi(this.apiConfig.baseUrl)) {
      return of({
        results: [],
        metadata: { partial: false, warnings: [] },
      });
    }

    const value = normalizeTrackingValue(query.type, query.value);
    return this.listOrders(value).pipe(
      switchMap((response) => {
        const remoteMatches = filterCandidates(query, response.data);
        if (remoteMatches.length > 0) {
          return this.buildResult(remoteMatches, []);
        }

        return this.buildResult([], []);
      }),
      catchError(() => this.buildResult([], [])),
    );
  }

  getByOrderId(orderId: string): Observable<TrackingSearchResult | null> {
    const importedOrder = this.importedOrdersStore.orders().find((order) => order.id === orderId);
    if (importedOrder) {
      return of(toImportedTrackingResult(importedOrder));
    }

    if (isStaticFrontendApi(this.apiConfig.baseUrl)) {
      return of(null);
    }

    return this.getOrder(orderId).pipe(
      switchMap((order) => {
        if (order) return this.toResultWithHistory(order);
        return of(null);
      }),
      catchError(() => of(null)),
    );
  }

  getByTrackingNumber(trackingNumber: string): Observable<TrackingConsolidatedResult> {
    return this.search({ type: 'tracking', value: trackingNumber });
  }

  private listOrders(search: string): Observable<TrackingOrderSearchResponse> {
    const params = new HttpParams()
      .set('page', 1)
      .set('pageSize', 10)
      .set('sortBy', 'updatedAt')
      .set('sortDirection', 'desc')
      .set('search', search);

    return this.http.get<ApiResponse<TrackingOrderSearchResponse>>(this.ordersUrl, { params }).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  private getOrder(id: string): Observable<Order | null> {
    return this.http.get<ApiResponse<Order | null>>(`${this.ordersUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  private getHistory(id: string): Observable<readonly OrderHistoryItem[]> {
    return this.http
      .get<ApiResponse<readonly OrderHistoryItem[]>>(`${this.ordersUrl}/history/${id}`)
      .pipe(
        map((response) => response.data),
        catchError(() => of([])),
      );
  }

  private toResultWithHistory(order: Order): Observable<TrackingSearchResult> {
    return this.getHistory(order.id).pipe(
      map((history) => toTrackingSearchResult(order, mergeHistory(order.id, history))),
    );
  }

  private buildResult(
    orders: readonly Order[],
    warnings: readonly string[],
  ): Observable<TrackingConsolidatedResult> {
    if (orders.length === 0) {
      return of({
        results: [],
        metadata: { partial: false, warnings },
      });
    }

    return forkJoin(orders.map((order) => this.toResultWithHistory(order))).pipe(
      map((results) => ({
        results,
        metadata: {
          partial: results.some((result) => result.timeline.length <= 1),
          warnings,
        },
      })),
    );
  }
}

function searchImportedOrders(
  query: TrackingSearchQuery,
  orders: readonly DailyOrder[],
): readonly DailyOrder[] {
  if (query.type !== 'tracking' || orders.length === 0) return [];

  const value = normalizeGuide(query.value);
  if (!value) return [];

  return orders.filter((order) => {
    return matchesGuideValue(order.guideNumber, value);
  });
}

function toImportedTrackingResult(order: DailyOrder): TrackingSearchResult {
  const orderStatus = toOrderStatus(order.status);
  const deliveryStatus = toDeliveryStatus(order);
  const updatedAt = order.lastMovementAt || order.lastUpdated || order.createdAt;
  const timeline = buildImportedTimeline(order);

  return {
    id: order.id,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: order.orderValue,
      quantity: order.quantity ?? 1,
      productName: order.productName,
      productGroupName: order.productGroupName,
      paymentMethod: toPaymentMethod(order.paymentMethod),
      paymentStatus: toPaymentStatus(order),
      orderStatus,
    },
    customer: {
      name: order.customerName,
      phoneMasked: maskImportedPhone(order.customerPhone),
      emailMasked: order.customerEmail,
      city: order.city,
      addressMasked: order.address ?? 'Sin direccion',
    },
    shipment: {
      carrier: order.carrier,
      trackingNumber: order.guideNumber,
      deliveryStatus,
      updatedAt,
    },
    currentStatus: {
      label: order.guideStatus || deliveryStatus,
      description: order.lastMovement || trackingStatusDescription(orderStatus, deliveryStatus),
      date: timeline[timeline.length - 1]?.date ?? updatedAt,
      hasNovelty: Boolean(order.novelty) || deliveryStatus === 'Failed',
      hasReturn: deliveryStatus === 'Returned',
    },
    timeline,
    returnSummary: {
      hasReturn: deliveryStatus === 'Returned',
      status: deliveryStatus === 'Returned' ? order.guideStatus || 'Devuelta' : undefined,
      description:
        deliveryStatus === 'Returned' ? order.observation || order.lastMovement : undefined,
    },
  };
}

function buildImportedTimeline(order: DailyOrder): readonly TrackingEvent[] {
  const events: TrackingEvent[] = [
    {
      id: `${order.id}-created`,
      title: 'Orden importada',
      description: `Orden ${order.orderNumber} cargada desde archivo.`,
      date: order.createdAt,
      source: 'orders',
    },
  ];

  if (order.guideGeneratedAt || order.guideNumber) {
    events.push({
      id: `${order.id}-guide`,
      title: 'Guia registrada',
      description: order.guideNumber ? `Guia ${order.guideNumber}.` : 'Guia registrada.',
      date: order.guideGeneratedAt || order.createdAt,
      source: 'deliveries',
    });
  }

  if (order.lastMovementAt || order.lastMovement || order.guideStatus) {
    events.push({
      id: `${order.id}-movement`,
      title: order.guideStatus || 'Movimiento logistico',
      description:
        order.lastMovement || order.lastMovementConcept || 'Movimiento de guia registrado.',
      date: order.lastMovementAt || order.lastUpdated || order.createdAt,
      source: 'deliveries',
    });
  }

  if (order.noveltyAt || order.novelty) {
    events.push({
      id: `${order.id}-novelty`,
      title: 'Novedad',
      description: order.novelty || order.solution || 'Novedad registrada.',
      date: order.noveltyAt || order.lastUpdated || order.createdAt,
      source: 'deliveries',
    });
  }

  return [...dedupeImportedEvents(events)].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function dedupeImportedEvents(events: readonly TrackingEvent[]): readonly TrackingEvent[] {
  const byId = new Map<string, TrackingEvent>();
  events.forEach((event) => byId.set(event.id, event));
  return Array.from(byId.values());
}

function toOrderStatus(status: DailyOrder['status']): OrderStatus {
  const normalized = normalizeText(status);

  if (normalized === 'confirmada') return 'Confirmed';
  if (normalized === 'en preparacion') return 'Processing';
  if (normalized === 'despachada' || normalized === 'en transito') return 'Shipped';
  if (normalized === 'entregada') return 'Delivered';
  if (normalized === 'devuelta') return 'Returned';
  if (normalized === 'cancelada') return 'Cancelled';

  return 'Pending';
}

function toDeliveryStatus(order: DailyOrder): DeliveryStatus {
  const guideStatus = normalizeText(order.guideStatus ?? '');
  const orderStatus = normalizeText(order.status);

  if (orderStatus === 'entregada' || guideStatus.includes('entreg')) return 'Delivered';
  if (orderStatus === 'devuelta' || guideStatus.includes('devuelt')) return 'Returned';
  if (
    orderStatus === 'cancelada' ||
    guideStatus.includes('novedad') ||
    guideStatus.includes('fallid')
  ) {
    return 'Failed';
  }
  if (
    orderStatus === 'despachada' ||
    orderStatus === 'en transito' ||
    guideStatus.includes('ruta') ||
    guideStatus.includes('reparto') ||
    guideStatus.includes('bodega') ||
    guideStatus.includes('recogid') ||
    guideStatus.includes('transportadora')
  ) {
    return 'In Transit';
  }
  if (orderStatus === 'confirmada' || orderStatus === 'en preparacion') return 'Assigned';

  return 'Pending';
}

function toPaymentMethod(method: DailyOrder['paymentMethod']): PaymentMethod {
  if (method === 'Transferencia') return 'Transfer';
  if (method === 'Tarjeta') return 'Card';
  if (method === 'PSE') return 'PSE';
  if (method === 'Contraentrega') return 'Cash on Delivery';
  return 'Other';
}

function toPaymentStatus(order: DailyOrder): PaymentStatus {
  if (order.status === 'Cancelada') return 'Failed';
  if (order.status === 'Devuelta') return 'Refunded';
  return order.paymentMethod === 'Contraentrega' ? 'Pending' : 'Paid';
}

function maskImportedPhone(phone: string): string {
  const digits = phone.replace(/\D+/g, '');
  if (digits.length <= 4) return phone;
  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

function matchesGuideValue(guideValue: string | undefined, searchValue: string): boolean {
  const guide = normalizeGuide(guideValue ?? '');
  const value = normalizeGuide(searchValue);
  const guideDigits = guide.replace(/\D+/g, '');
  const valueDigits = value.replace(/\D+/g, '');

  if (!guide || !value) return false;

  return (
    guide === value ||
    guide.includes(value) ||
    (valueDigits.length >= 3 && guideDigits.includes(valueDigits))
  );
}

function normalizeGuide(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function mergeHistory(
  orderId: string,
  history: readonly OrderHistoryItem[],
): readonly OrderHistoryItem[] {
  void orderId;
  return history;
}

function filterCandidates(query: TrackingSearchQuery, orders: readonly Order[]): readonly Order[] {
  const value = normalizeTrackingValue(query.type, query.value).toLowerCase();

  if (query.type === 'tracking') {
    return orders.filter((order) => matchesGuideValue(order.trackingNumber, value));
  }

  if (query.type === 'order') {
    return orders.filter(
      (order) => order.orderNumber.toLowerCase().includes(value) || order.id === query.value,
    );
  }

  if (query.type === 'phone') {
    return orders.filter((order) =>
      order.customerPhone.replace(/\s+/g, '').includes(value.replace(/\s+/g, '')),
    );
  }

  if (query.type === 'email') {
    return orders.filter((order) => order.customerEmail?.toLowerCase().includes(value));
  }

  return orders.filter((order) => order.customerName.toLowerCase().includes(value));
}

function toReadableError(error: HttpErrorResponse | Error): Error {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return new Error('No fue posible conectar con el backend.');
    const response = error.error as Partial<ApiResponse<unknown>> | null;
    return new Error(response?.message || statusMessage(error.status));
  }

  return error;
}

function statusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La búsqueda no es válida.',
    401: 'Tu sesión no está autenticada.',
    403: 'No tienes permisos para rastrear pedidos.',
    404: 'No encontramos resultados con los datos ingresados.',
    409: 'La búsqueda devolvió información en conflicto.',
    422: 'Los datos de búsqueda no cumplen las reglas del backend.',
    500: 'Ocurrió un error interno consultando el rastreo.',
  };

  return messages[status] ?? 'No fue posible completar la búsqueda.';
}
