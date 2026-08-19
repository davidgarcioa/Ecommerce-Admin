import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  FileAccessUrl,
  FileStatistics,
  ManagedFile,
} from './files.models';

@Injectable({ providedIn: 'root' })
export class FilesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/files`;

  listFiles(): Observable<readonly ManagedFile[]> {
    return this.get<readonly ManagedFile[]>(this.baseUrl);
  }

  statistics(): Observable<FileStatistics> {
    return this.get<FileStatistics>(`${this.baseUrl}/statistics`);
  }

  getFile(id: string): Observable<ManagedFile | null> {
    return this.get<ManagedFile | null>(`${this.baseUrl}/${id}`);
  }

  uploadFile(formData: FormData): Observable<ManagedFile> {
    return this.http.post<ApiResponse<ManagedFile>>(`${this.baseUrl}/upload`, formData).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  updateFile(id: string, payload: object): Observable<ManagedFile> {
    return this.patch<ManagedFile>(`${this.baseUrl}/${id}`, payload);
  }

  archiveFile(id: string): Observable<ManagedFile> {
    return this.patch<ManagedFile>(`${this.baseUrl}/${id}/archive`, {});
  }

  restoreFile(id: string): Observable<ManagedFile> {
    return this.patch<ManagedFile>(`${this.baseUrl}/${id}/restore`, {});
  }

  deleteFile(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error: HttpErrorResponse) => throwError(() => toReadableError(error))),
    );
  }

  downloadUrl(id: string): Observable<FileAccessUrl> {
    return this.get<FileAccessUrl>(`${this.baseUrl}/${id}/download`);
  }

  previewUrl(id: string): Observable<FileAccessUrl> {
    return this.get<FileAccessUrl>(`${this.baseUrl}/${id}/preview`);
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

function toReadableError(error: HttpErrorResponse): Error {
  if (error.status === 0) return new Error('No fue posible conectar con el backend.');

  const response = error.error as Partial<ApiResponse<unknown>> | null;
  return new Error(response?.message || resolveStatusMessage(error.status));
}

function resolveStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'La solicitud no es válida.',
    401: 'Tu sesión no está autenticada.',
    403: 'No tienes permisos para administrar archivos.',
    404: 'El archivo solicitado no existe.',
    413: 'El archivo supera el tamaño permitido.',
    415: 'El tipo de archivo no está permitido.',
    500: 'Ocurrió un error interno en el servidor.',
    503: 'Firebase Storage no está configurado.',
  };

  return messages[status] ?? 'No fue posible completar la operación.';
}
