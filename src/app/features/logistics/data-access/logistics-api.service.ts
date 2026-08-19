import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  DeliveryDetail,
  LogisticsHistoryItem,
  LogisticsOrder,
  LogisticsQuery,
  LogisticsResource,
  LogisticsStatistics,
  ReturnDetail,
  UpdateLogisticsDeliveryStatusRequest,
  UpdateShipmentRequest,
} from './logistics.models';
import { OrderPagination } from '../../office/data-access/office.models';

export interface PaginatedLogisticsOrdersResponse {
  readonly data: readonly LogisticsOrder[];
  readonly meta: OrderPagination;
}

@Injectable({ providedIn: 'root' })
export class LogisticsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly ordersUrl = `${this.apiConfig.baseUrl}/orders`;
  private readonly deliveriesUrl = `${this.apiConfig.baseUrl}/deliveries`;
  private readonly returnsUrl = `${this.apiConfig.baseUrl}/returns`;

  listOrders(query: LogisticsQuery): Observable<PaginatedLogisticsOrdersResponse> {
    return this.http
      .get<ApiResponse<PaginatedLogisticsOrdersResponse>>(this.ordersUrl, {
        params: toLogisticsOrderParams(query),
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  getStatistics(query: LogisticsQuery): Observable<LogisticsStatistics> {
    return this.http
      .get<ApiResponse<LogisticsStatistics>>(`${this.ordersUrl}/statistics`, {
        params: toLogisticsOrderParams(query),
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  getOrder(id: string): Observable<LogisticsOrder | null> {
    return this.get<LogisticsOrder | null>(`${this.ordersUrl}/${id}`);
  }

  updateShipment(id: string, payload: UpdateShipmentRequest): Observable<LogisticsOrder> {
    return this.patch<LogisticsOrder>(`${this.ordersUrl}/${id}`, payload);
  }

  updateDeliveryStatus(
    id: string,
    payload: UpdateLogisticsDeliveryStatusRequest,
  ): Observable<LogisticsOrder> {
    return this.patch<LogisticsOrder>(`${this.ordersUrl}/${id}/delivery-status`, payload);
  }

  getOrderHistory(id: string): Observable<readonly LogisticsHistoryItem[]> {
    return this.get<readonly LogisticsHistoryItem[]>(`${this.ordersUrl}/history/${id}`);
  }

  listDeliveries(): Observable<readonly DeliveryDetail[]> {
    return this.get<readonly LogisticsResource[]>(this.deliveriesUrl);
  }

  listReturns(): Observable<readonly ReturnDetail[]> {
    return this.get<readonly LogisticsResource[]>(this.returnsUrl);
  }

  getReturn(id: string): Observable<ReturnDetail | null> {
    return this.get<ReturnDetail | null>(`${this.returnsUrl}/${id}`);
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

function toLogisticsOrderParams(query: LogisticsQuery): HttpParams {
  let params = new HttpParams()
    .set('page', query.page)
    .set('pageSize', query.pageSize)
    .set('sortBy', query.sortBy)
    .set('sortDirection', query.sortDirection);

  if (query.search.trim()) params = params.set('search', query.search.trim());

  const filters = query.filters;
  if (filters.orderStatus !== 'all') params = params.set('orderStatus', filters.orderStatus);
  if (filters.deliveryStatus !== 'all') {
    params = params.set('deliveryStatus', filters.deliveryStatus);
  }
  if (filters.paymentStatus !== 'all') params = params.set('paymentStatus', filters.paymentStatus);
  if (filters.city.trim()) params = params.set('city', filters.city.trim());
  if (filters.carrier.trim()) params = params.set('carrier', filters.carrier.trim());
  if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

  return params;
}

function toReadableError(error: HttpErrorResponse): Error {
  if (error.status === 0) return new Error('No fue posible conectar con el backend.');

  const response = error.error as Partial<ApiResponse<unknown>> | null;
  return new Error(response?.message || resolveStatusMessage(error.status));
}

function resolveStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La solicitud logística no es válida.',
    401: 'Tu sesión no está autenticada.',
    403: 'No tienes permisos para esta acción logística.',
    404: 'El registro logístico solicitado no existe.',
    409: 'La operación genera conflicto con el estado actual.',
    422: 'Los datos logísticos no cumplen las reglas del backend.',
    500: 'Ocurrió un error interno en el servidor.',
  };

  return messages[status] ?? 'No fue posible completar la operación logística.';
}
