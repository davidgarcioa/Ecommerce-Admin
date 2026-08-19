import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AssociateProductsRequest,
  CreateProductGroupRequest,
  ProductGroup,
  ProductGroupHistoryEntry,
  ProductGroupProduct,
  ProductGroupProfitability,
  ProductGroupStatistics,
  ProductListResult,
  ReorderProductsRequest,
  UpdateProductGroupRequest,
} from './product-groups.models';

@Injectable({ providedIn: 'root' })
export class ProductGroupsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  private readonly baseUrl = `${this.apiConfig.baseUrl}/product-groups`;
  private readonly productsUrl = `${this.apiConfig.baseUrl}/v1/products`;

  listGroups(): Observable<readonly ProductGroup[]> {
    return this.get<readonly ProductGroup[]>(this.baseUrl);
  }

  getGroup(id: string): Observable<ProductGroup | null> {
    return this.get<ProductGroup | null>(`${this.baseUrl}/${id}`);
  }

  createGroup(payload: CreateProductGroupRequest): Observable<ProductGroup> {
    return this.post<ProductGroup>(this.baseUrl, payload);
  }

  updateGroup(id: string, payload: UpdateProductGroupRequest): Observable<ProductGroup> {
    return this.patch<ProductGroup>(`${this.baseUrl}/${id}`, payload);
  }

  archiveGroup(id: string): Observable<ProductGroup> {
    return this.patch<ProductGroup>(`${this.baseUrl}/${id}/archive`, {});
  }

  restoreGroup(id: string): Observable<ProductGroup> {
    return this.patch<ProductGroup>(`${this.baseUrl}/${id}/restore`, {});
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  statistics(): Observable<ProductGroupStatistics> {
    return this.get<ProductGroupStatistics>(`${this.baseUrl}/statistics`);
  }

  profitability(id: string): Observable<ProductGroupProfitability> {
    return this.get<ProductGroupProfitability>(`${this.baseUrl}/${id}/profitability`);
  }

  groupProducts(id: string): Observable<readonly ProductGroupProduct[]> {
    return this.get<readonly ProductGroupProduct[]>(`${this.baseUrl}/${id}/products`);
  }

  availableProducts(search: string): Observable<readonly ProductGroupProduct[]> {
    const params = new HttpParams()
      .set('limit', 100)
      .set('sortBy', 'name')
      .set('sortDirection', 'asc')
      .set('search', search);

    return this.http.get<ApiResponse<ProductListResult>>(this.productsUrl, { params }).pipe(
      map((response) => response.data.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  addProducts(id: string, payload: AssociateProductsRequest): Observable<ProductGroup> {
    return this.post<ProductGroup>(`${this.baseUrl}/${id}/products`, payload);
  }

  removeProduct(id: string, productId: string): Observable<ProductGroup> {
    return this.http
      .delete<ApiResponse<ProductGroup>>(`${this.baseUrl}/${id}/products/${productId}`)
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  reorderProducts(id: string, payload: ReorderProductsRequest): Observable<ProductGroup> {
    return this.patch<ProductGroup>(`${this.baseUrl}/${id}/products/reorder`, payload);
  }

  history(id: string): Observable<readonly ProductGroupHistoryEntry[]> {
    return this.get<readonly ProductGroupHistoryEntry[]>(`${this.baseUrl}/${id}/history`);
  }

  private get<TData>(url: string): Observable<TData> {
    return this.http.get<ApiResponse<TData>>(url).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  private post<TData>(url: string, payload: object): Observable<TData> {
    return this.http.post<ApiResponse<TData>>(url, payload).pipe(
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

function toReadableError(error: HttpErrorResponse): Error {
  if (error.status === 0) {
    return new Error('No fue posible conectar con el backend.');
  }

  const response = error.error as Partial<ApiResponse<unknown>> | null;
  const message = response?.message || resolveStatusMessage(error.status);
  return new Error(message);
}

function resolveStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La solicitud no es válida.',
    401: 'Tu sesión no está autenticada.',
    403: 'No tienes permisos para esta acción.',
    404: 'El recurso solicitado no existe.',
    409: 'La operación genera un conflicto con datos existentes.',
    422: 'Los datos no cumplen las reglas del backend.',
    500: 'Ocurrió un error interno en el servidor.',
  };

  return messages[status] ?? 'No fue posible completar la operación.';
}
