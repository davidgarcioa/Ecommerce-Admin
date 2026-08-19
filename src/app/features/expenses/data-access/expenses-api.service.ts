import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CreateExpenseRequest, Expense, UpdateExpenseRequest } from './expenses.models';

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/expenses`;

  listExpenses(): Observable<readonly Expense[]> {
    return this.get<readonly Expense[]>(this.baseUrl);
  }

  getExpense(id: string): Observable<Expense | null> {
    return this.get<Expense | null>(`${this.baseUrl}/${id}`);
  }

  createExpense(payload: CreateExpenseRequest): Observable<Expense> {
    return this.post<Expense>(this.baseUrl, payload);
  }

  updateExpense(id: string, payload: UpdateExpenseRequest): Observable<Expense> {
    return this.patch<Expense>(`${this.baseUrl}/${id}`, payload);
  }

  deleteExpense(id: string): Observable<void> {
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
    400: 'La solicitud no es válida.',
    401: 'Tu sesión no está autenticada.',
    403: 'No tienes permisos para consultar gastos.',
    404: 'El gasto solicitado no existe.',
    409: 'La operación genera un conflicto con datos existentes.',
    413: 'El comprobante supera el tamaño permitido.',
    415: 'El tipo de comprobante no está soportado.',
    422: 'Los datos no cumplen las reglas del backend.',
    500: 'Ocurrió un error interno en el servidor.',
  };

  return messages[status] ?? 'No fue posible completar la operación.';
}
