import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { API_CONFIG, isStaticFrontendApi } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { AccountStorageService } from '../../../core/services/account-storage.service';
import { PermissionCode } from '../../../core/services/permissions.service';
import { DailyOrder } from '../../daily-report/models/daily-order.model';
import { ImportedOrdersStoreService } from '../../daily-report/services/imported-orders-store.service';
import { ImportHistoryService } from '../../files/services/import-history.service';
import { toImportedProductGroups } from '../../product-groups/data-access/imported-product-groups.mapper';
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

const LOCAL_TESTS_STORAGE_KEY = 'ecommerce.testing.local.records';
const LOCAL_TAGS_STORAGE_KEY = 'ecommerce.tags.local.records';
const LOCAL_PRODUCT_GROUPS_STORAGE_KEY = 'ecommerce.product-groups.local.records';

@Injectable({ providedIn: 'root' })
export class HomeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly accountStorage = inject(AccountStorageService);
  private readonly importedOrdersStore = inject(ImportedOrdersStoreService);
  private readonly importHistory = inject(ImportHistoryService);
  private readonly baseUrl = this.apiConfig.baseUrl;

  loadOverview(permissions: readonly PermissionCode[]): Observable<HomeStatisticsResponse> {
    if (isStaticFrontendApi(this.baseUrl)) {
      return of(this.loadStaticOverview(permissions));
    }

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

  private loadStaticOverview(permissions: readonly PermissionCode[]): HomeStatisticsResponse {
    const orders = this.importedOrdersStore.orders();
    const productGroups =
      orders.length > 0
        ? toImportedProductGroups(orders)
        : readStoredRecords(this.accountStorage, LOCAL_PRODUCT_GROUPS_STORAGE_KEY);
    const fileHistory = this.importHistory.history();

    return {
      orders: this.has(permissions, 'orders.statistics') ? buildOrderStatistics(orders) : null,
      testing: this.has(permissions, 'testing.statistics')
        ? buildTestingStatistics(readStoredRecords(this.accountStorage, LOCAL_TESTS_STORAGE_KEY))
        : null,
      tags: this.has(permissions, 'tags.statistics')
        ? buildTagStatistics(readStoredRecords(this.accountStorage, LOCAL_TAGS_STORAGE_KEY))
        : null,
      productGroups: this.has(permissions, 'product-groups.statistics')
        ? buildProductGroupStatistics(productGroups)
        : null,
      files: this.has(permissions, 'files.import')
        ? {
            total: fileHistory.length,
            active: fileHistory.filter((record) => record.status !== 'Cancelada').length,
            archived: 0,
            withoutRelation: 0,
          }
        : null,
      errors: [],
    };
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

function buildOrderStatistics(orders: readonly DailyOrder[]): OrderHomeStatistics {
  return {
    totalOrders: orders.length,
    sales: orders.reduce((sum, order) => sum + Math.max(0, order.orderValue), 0),
    cancelled: orders.filter((order) => order.status === 'Cancelada').length,
    delivered: orders.filter((order) => order.status === 'Entregada').length,
    inTransit: orders.filter((order) =>
      ['en preparacion', 'despachada', 'en transito'].includes(normalize(order.status)),
    ).length,
    urgent: orders.filter((order) => order.urgent).length,
  };
}

function buildTestingStatistics(records: readonly unknown[]): TestingHomeStatistics {
  return {
    total: records.length,
    active: records.filter((record) => readString(record, 'status') === 'active').length,
    draft: records.filter((record) => readString(record, 'status') === 'draft').length,
    paused: records.filter((record) => readString(record, 'status') === 'paused').length,
  };
}

function buildTagStatistics(records: readonly unknown[]): TagHomeStatistics {
  return {
    total: records.length,
    active: records.filter((record) => readBoolean(record, 'active')).length,
    unused: records.filter((record) => readNumber(record, 'usageCount') === 0).length,
  };
}

function buildProductGroupStatistics(records: readonly unknown[]): ProductGroupHomeStatistics {
  return {
    total: records.length,
    active: records.filter((record) => readBoolean(record, 'active')).length,
    archived: records.filter((record) => !readBoolean(record, 'active')).length,
    associatedProducts: records.reduce<number>(
      (sum, record) => sum + readNumber(record, 'productCount'),
      0,
    ),
  };
}

function readStoredRecords(storage: AccountStorageService, key: string): readonly unknown[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readString(record: unknown, key: string): string {
  if (!record || typeof record !== 'object') return '';

  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function readBoolean(record: unknown, key: string): boolean {
  if (!record || typeof record !== 'object') return false;

  return (record as Record<string, unknown>)[key] === true;
}

function readNumber(record: unknown, key: string): number {
  if (!record || typeof record !== 'object') return 0;

  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
