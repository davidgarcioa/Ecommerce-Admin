import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Order, OrderHistoryItem } from '../../office/data-access/office.models';
import { normalizeTrackingValue } from '../utils/tracking.validators';
import { toTrackingSearchResult } from './tracking.mapper';
import {
  TrackingConsolidatedResult,
  TrackingOrderSearchResponse,
  TrackingSearchQuery,
  TrackingSearchResult,
} from './tracking.models';

@Injectable({ providedIn: 'root' })
export class TrackingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly ordersUrl = `${this.apiConfig.baseUrl}/orders`;

  search(query: TrackingSearchQuery): Observable<TrackingConsolidatedResult> {
    const value = normalizeTrackingValue(query.type, query.value);
    return this.listOrders(value).pipe(
      switchMap((response) => {
        const candidates = filterCandidates(query, response.data);
        if (candidates.length === 0) {
          return of({
            results: [],
            metadata: { partial: false, warnings: [] },
          });
        }

        return forkJoin(candidates.map((order) => this.toResultWithHistory(order))).pipe(
          map((results) => ({
            results,
            metadata: {
              partial: results.some((result) => result.timeline.length <= 1),
              warnings: [],
            },
          })),
        );
      }),
      catchError((error: HttpErrorResponse | Error) => throwError(() => toReadableError(error))),
    );
  }

  getByOrderId(orderId: string): Observable<TrackingSearchResult | null> {
    return this.getOrder(orderId).pipe(
      switchMap((order) => (order ? this.toResultWithHistory(order) : of(null))),
      catchError((error: HttpErrorResponse | Error) => throwError(() => toReadableError(error))),
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
    return this.getHistory(order.id).pipe(map((history) => toTrackingSearchResult(order, history)));
  }
}

function filterCandidates(query: TrackingSearchQuery, orders: readonly Order[]): readonly Order[] {
  const value = normalizeTrackingValue(query.type, query.value).toLowerCase();

  if (query.type === 'tracking') {
    return orders.filter((order) => order.trackingNumber?.toLowerCase() === value);
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
