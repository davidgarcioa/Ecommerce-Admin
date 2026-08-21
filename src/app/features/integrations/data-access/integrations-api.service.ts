import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  DropiAuthToken,
  DropiIntegrationStatus,
  DropiSyncSummary,
  HealthCheckResponse,
  MetaAdsPreview,
  MetaConnectionCheck,
  MetaIntegrationStatus,
  SyncDropiOrdersRequest,
} from './integrations.models';

@Injectable({ providedIn: 'root' })
export class IntegrationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = this.apiConfig.baseUrl;

  loadHealth(): Observable<HealthCheckResponse> {
    return this.http.get<ApiResponse<HealthCheckResponse>>(`${this.baseUrl}/health`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  loadDropiStatus(): Observable<DropiIntegrationStatus> {
    return this.http
      .get<ApiResponse<DropiIntegrationStatus>>(`${this.baseUrl}/integrations/dropi/status`)
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  loadMetaStatus(): Observable<MetaIntegrationStatus> {
    return this.http
      .get<ApiResponse<MetaIntegrationStatus>>(`${this.baseUrl}/integrations/meta/status`)
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  testMetaConnection(): Observable<MetaConnectionCheck> {
    return this.http
      .post<ApiResponse<MetaConnectionCheck>>(
        `${this.baseUrl}/integrations/meta/test-connection`,
        {},
      )
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  previewMetaAds(): Observable<MetaAdsPreview> {
    return this.http
      .post<ApiResponse<MetaAdsPreview>>(`${this.baseUrl}/integrations/meta/preview`, {})
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  testDropiAuthentication(): Observable<DropiAuthToken> {
    return this.http
      .post<ApiResponse<DropiAuthToken>>(`${this.baseUrl}/integrations/dropi/test-auth`, {})
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }

  syncDropiOrders(request: SyncDropiOrdersRequest): Observable<DropiSyncSummary> {
    return this.http
      .post<ApiResponse<DropiSyncSummary>>(
        `${this.baseUrl}/integrations/dropi/sync-orders`,
        request,
      )
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
      );
  }
}

function toReadableError(error: HttpErrorResponse): Error {
  const response = error.error as Partial<ApiResponse<unknown>> | null;
  const message =
    response?.message ??
    (error.status === 0
      ? 'No se pudo conectar con el backend.'
      : 'No se pudo validar la integración.');

  return new Error(message);
}
