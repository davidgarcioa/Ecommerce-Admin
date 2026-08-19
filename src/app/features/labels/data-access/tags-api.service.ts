import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CreateTagRequest, Tag, TagStatistics, UpdateTagRequest } from './tags.models';

@Injectable({ providedIn: 'root' })
export class TagsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/tags`;

  listTags(): Observable<readonly Tag[]> {
    return this.get<readonly Tag[]>(this.baseUrl);
  }

  statistics(): Observable<TagStatistics> {
    return this.get<TagStatistics>(`${this.baseUrl}/statistics`);
  }

  getTag(id: string): Observable<Tag | null> {
    return this.get<Tag | null>(`${this.baseUrl}/${id}`);
  }

  createTag(payload: CreateTagRequest): Observable<Tag> {
    return this.post<Tag>(this.baseUrl, payload);
  }

  updateTag(id: string, payload: UpdateTagRequest): Observable<Tag> {
    return this.patch<Tag>(`${this.baseUrl}/${id}`, payload);
  }

  archiveTag(id: string): Observable<Tag> {
    return this.patch<Tag>(`${this.baseUrl}/${id}/archive`, {});
  }

  restoreTag(id: string): Observable<Tag> {
    return this.patch<Tag>(`${this.baseUrl}/${id}/restore`, {});
  }

  deleteTag(id: string): Observable<void> {
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
    403: 'No tienes permisos para administrar etiquetas.',
    404: 'La etiqueta solicitada no existe.',
    409: 'Ya existe una etiqueta con esos datos.',
    422: 'Los datos no cumplen las reglas del backend.',
    500: 'Ocurrio un error interno en el servidor.',
  };

  return messages[status] ?? 'No fue posible completar la operacion.';
}
