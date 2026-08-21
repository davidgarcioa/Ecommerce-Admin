import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PermissionCode } from '../../../core/services/permissions.service';
import {
  AdminRole,
  AdminUser,
  CreateRoleRequest,
  CreateUserRequest,
  PersistedPermission,
  UpdateRoleRequest,
  UpdateUserRequest,
} from './settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly baseUrl = this.apiConfig.baseUrl;

  listUsers(): Observable<readonly AdminUser[]> {
    return this.get<readonly AdminUser[]>(`${this.baseUrl}/users`);
  }

  createUser(payload: CreateUserRequest): Observable<AdminUser> {
    return this.post<AdminUser>(`${this.baseUrl}/users`, payload);
  }

  updateUser(id: string, payload: UpdateUserRequest): Observable<AdminUser> {
    return this.patch<AdminUser>(`${this.baseUrl}/users/${id}`, payload);
  }

  listRoles(): Observable<readonly AdminRole[]> {
    return this.get<readonly AdminRole[]>(`${this.baseUrl}/roles`);
  }

  defaultRoles(): Observable<readonly CreateRoleRequest[]> {
    return this.get<readonly CreateRoleRequest[]>(`${this.baseUrl}/roles/defaults`);
  }

  createRole(payload: CreateRoleRequest): Observable<AdminRole> {
    return this.post<AdminRole>(`${this.baseUrl}/roles`, payload);
  }

  updateRole(id: string, payload: UpdateRoleRequest): Observable<AdminRole> {
    return this.patch<AdminRole>(`${this.baseUrl}/roles/${id}`, payload);
  }

  systemPermissions(): Observable<readonly PermissionCode[]> {
    return this.get<readonly PermissionCode[]>(`${this.baseUrl}/permissions/system`);
  }

  persistedPermissions(): Observable<readonly PersistedPermission[]> {
    return this.get<readonly PersistedPermission[]>(`${this.baseUrl}/permissions`);
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
  return new Error(response?.message || 'No fue posible completar la operación.');
}
