import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Order,
  OrderHistoryItem,
  OrderQuery,
  OrderStatistics,
  PaginatedOrdersResponse,
  UpdateDeliveryStatusRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
} from './office.models';

@Injectable({ providedIn: 'root' })
export class OfficeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/orders`;

  listOrders(query: OrderQuery): Observable<PaginatedOrdersResponse> {
    return this.http
      .get<ApiResponse<PaginatedOrdersResponse>>(this.baseUrl, {
        params: toOrderParams(query),
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  getStatistics(query: OrderQuery): Observable<OrderStatistics> {
    return this.http
      .get<ApiResponse<OrderStatistics>>(`${this.baseUrl}/statistics`, {
        params: toOrderParams(query),
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  getOrder(id: string): Observable<Order | null> {
    return this.get<Order | null>(`${this.baseUrl}/${id}`);
  }

  updateOrder(id: string, payload: UpdateOrderRequest): Observable<Order> {
    return this.patch<Order>(`${this.baseUrl}/${id}`, payload);
  }

  updateOrderStatus(id: string, payload: UpdateOrderStatusRequest): Observable<Order> {
    return this.patch<Order>(`${this.baseUrl}/${id}/status`, payload);
  }

  updatePaymentStatus(id: string, payload: UpdatePaymentStatusRequest): Observable<Order> {
    return this.patch<Order>(`${this.baseUrl}/${id}/payment-status`, payload);
  }

  updateDeliveryStatus(id: string, payload: UpdateDeliveryStatusRequest): Observable<Order> {
    return this.patch<Order>(`${this.baseUrl}/${id}/delivery-status`, payload);
  }

  getHistory(id: string): Observable<readonly OrderHistoryItem[]> {
    return this.get<readonly OrderHistoryItem[]>(`${this.baseUrl}/history/${id}`);
  }

  private get<TData>(url: string): Observable<TData> {
    return this.http.get<ApiResponse<TData>>(url).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  private patch<TData>(url: string, payload: object): Observable<TData> {
    return this.http.patch<ApiResponse<TData>>(url, payload).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }
}

function toOrderParams(query: OrderQuery): HttpParams {
  let params = new HttpParams()
    .set('page', query.page)
    .set('pageSize', query.pageSize)
    .set('sortBy', query.sortBy)
    .set('sortDirection', query.sortDirection);

  if (query.search.trim()) {
    params = params.set('search', query.search.trim());
  }

  const filters = query.filters;
  if (filters.pendingConfirmation) {
    params = params.set('orderStatus', 'Pending');
  } else if (filters.orderStatus !== 'all') {
    params = params.set('orderStatus', filters.orderStatus);
  }
  if (filters.paymentStatus !== 'all') params = params.set('paymentStatus', filters.paymentStatus);
  if (filters.deliveryStatus !== 'all')
    params = params.set('deliveryStatus', filters.deliveryStatus);
  if (filters.city.trim()) params = params.set('city', filters.city.trim());
  if (filters.carrier.trim()) params = params.set('carrier', filters.carrier.trim());
  if (filters.urgent !== 'all') params = params.set('urgent', filters.urgent === 'urgent');
  if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

  return params;
}

function toReadableError(error: HttpErrorResponse): Error {
  if (error.status === 0) {
    return new Error('No fue posible conectar con el backend.');
  }

  const response = error.error as Partial<ApiResponse<unknown>> | null;
  return new Error(response?.message || resolveStatusMessage(error.status));
}

function resolveStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La solicitud no es válida.',
    401: 'Tu sesión no está autenticada.',
    403: 'No tienes permisos para esta acción.',
    404: 'El pedido solicitado no existe.',
    409: 'La operación genera un conflicto con el estado actual.',
    422: 'Los datos no cumplen las reglas del backend.',
    500: 'Ocurrió un error interno en el servidor.',
  };

  return messages[status] ?? 'No fue posible completar la operación.';
}
