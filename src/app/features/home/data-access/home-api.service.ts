import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PermissionCode } from '../../../core/services/permissions.service';
import {
  FileHomeStatistics,
  HomeStatisticsResponse,
  OrderHomeStatistics,
  ProductGroupHomeStatistics,
  TagHomeStatistics,
  TestingHomeStatistics,
} from './home.models';

interface HomeSectionResult<TData> {
  readonly data: TData | null;
  readonly error: string | null;
}

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = this.apiConfig.baseUrl;

  loadOverview(permissions: readonly PermissionCode[]): Observable<HomeStatisticsResponse> {
    return forkJoin({
      orders: this.has(permissions, 'orders.statistics')
        ? this.safeGet<OrderHomeStatistics>('orders', `${this.baseUrl}/orders/statistics`, {
            page: 1,
            pageSize: 1,
            sortBy: 'createdAt',
            sortDirection: 'desc',
          })
        : of(emptyResult<OrderHomeStatistics>()),
      testing: this.has(permissions, 'testing.statistics')
        ? this.safeGet<TestingHomeStatistics>('testeos', `${this.baseUrl}/testing/statistics`)
        : of(emptyResult<TestingHomeStatistics>()),
      tags: this.has(permissions, 'tags.statistics')
        ? this.safeGet<TagHomeStatistics>('etiquetas', `${this.baseUrl}/tags/statistics`)
        : of(emptyResult<TagHomeStatistics>()),
      productGroups: this.has(permissions, 'product-groups.statistics')
        ? this.safeGet<ProductGroupHomeStatistics>(
            'conjuntos',
            `${this.baseUrl}/product-groups/statistics`,
          )
        : of(emptyResult<ProductGroupHomeStatistics>()),
      files: this.has(permissions, 'files.import')
        ? this.safeGet<FileHomeStatistics>('archivos', `${this.baseUrl}/files/statistics`)
        : of(emptyResult<FileHomeStatistics>()),
    }).pipe(
      map((result) => ({
        orders: result.orders.data,
        testing: result.testing.data,
        tags: result.tags.data,
        productGroups: result.productGroups.data,
        files: result.files.data,
        errors: Object.values(result)
          .map((section) => section.error)
          .filter((error): error is string => Boolean(error)),
      })),
    );
  }

  private safeGet<TData>(
    label: string,
    url: string,
    params?: Record<string, string | number>,
  ): Observable<HomeSectionResult<TData>> {
    return this.http
      .get<ApiResponse<TData>>(url, {
        params: params ? new HttpParams({ fromObject: params }) : undefined,
      })
      .pipe(
        map((response) => ({ data: response.data, error: null })),
        catchError((error: HttpErrorResponse) =>
          of({
            data: null,
            error: `${label}: ${toReadableError(error)}`,
          }),
        ),
      );
  }

  private has(permissions: readonly PermissionCode[], permission: PermissionCode): boolean {
    return permissions.includes(permission);
  }
}

function emptyResult<TData>(): HomeSectionResult<TData> {
  return { data: null, error: null };
}

function toReadableError(error: HttpErrorResponse): string {
  if (error.status === 0) return 'backend no disponible';

  const response = error.error as Partial<ApiResponse<unknown>> | null;
  return response?.message || resolveStatusMessage(error.status);
}

function resolveStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'solicitud no válida',
    401: 'sesión no autenticada',
    403: 'permiso insuficiente',
    404: 'endpoint no encontrado',
    500: 'error interno',
  };

  return messages[status] ?? 'no fue posible cargar datos';
}
