import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  CreateTestingRequest,
  EcommerceTest,
  TestingStatistics,
  UpdateTestingRequest,
} from './testing.models';

@Injectable({ providedIn: 'root' })
export class TestingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/testing`;

  listTests(): Observable<readonly EcommerceTest[]> {
    return this.get<readonly EcommerceTest[]>(this.baseUrl);
  }

  statistics(): Observable<TestingStatistics> {
    return this.get<TestingStatistics>(`${this.baseUrl}/statistics`);
  }

  getTest(id: string): Observable<EcommerceTest | null> {
    return this.get<EcommerceTest | null>(`${this.baseUrl}/${id}`);
  }

  createTest(payload: CreateTestingRequest): Observable<EcommerceTest> {
    return this.post<EcommerceTest>(this.baseUrl, payload);
  }

  updateTest(id: string, payload: UpdateTestingRequest): Observable<EcommerceTest> {
    return this.patch<EcommerceTest>(`${this.baseUrl}/${id}`, payload);
  }

  archiveTest(id: string): Observable<EcommerceTest> {
    return this.patch<EcommerceTest>(`${this.baseUrl}/${id}/archive`, {});
  }

  restoreTest(id: string): Observable<EcommerceTest> {
    return this.patch<EcommerceTest>(`${this.baseUrl}/${id}/restore`, {});
  }

  deleteTest(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
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
  if (error.status === 0) return new Error('No fue posible conectar con el backend.');
  const response = error.error as Partial<ApiResponse<unknown>> | null;
  return new Error(response?.message || resolveStatusMessage(error.status));
}

function resolveStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La solicitud no es valida.',
    401: 'Tu sesion no esta autenticada.',
    403: 'No tienes permisos para administrar testeos.',
    404: 'El testeo solicitado no existe.',
    409: 'Ya existe un testeo con esos datos.',
    422: 'Los datos no cumplen las reglas del backend.',
    500: 'Ocurrio un error interno en el servidor.',
  };

  return messages[status] ?? 'No fue posible completar la operacion.';
}
