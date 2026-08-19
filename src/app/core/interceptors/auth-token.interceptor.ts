import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';

import { AuthSessionService } from '../../features/auth/data-access/auth-session.service';
import { AuthTokenResponse } from '../../features/auth/data-access/auth.models';

let refreshRequest$: Observable<AuthTokenResponse> | null = null;

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const token = authSession.getAccessToken();
  const authenticatedRequest = token ? withToken(request, token) : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(error, request.url)) {
        return throwError(() => error);
      }

      return getSharedRefresh(authSession).pipe(
        switchMap((tokens) => next(withToken(request, tokens.accessToken))),
        catchError((refreshError: unknown) => {
          authSession.clearSession();
          void router.navigate(['/auth']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function getSharedRefresh(authSession: AuthSessionService): Observable<AuthTokenResponse> {
  refreshRequest$ ??= authSession.refreshSession().pipe(
    finalize(() => {
      refreshRequest$ = null;
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  return refreshRequest$;
}

function withToken<TRequest>(request: HttpRequest<TRequest>, token: string): HttpRequest<TRequest> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function shouldRefresh(error: unknown, url: string): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 401 &&
    isApplicationAuthError(error) &&
    !url.includes('/auth/login') &&
    !url.includes('/auth/firebase-login') &&
    !url.includes('/auth/firebase-register') &&
    !url.includes('/auth/refresh')
  );
}

function isApplicationAuthError(error: HttpErrorResponse): boolean {
  const message = readErrorMessage(error);

  if (!message) {
    return true;
  }

  const normalizedMessage = normalizeMessage(message);

  return (
    normalizedMessage.includes('token invalido') ||
    normalizedMessage.includes('token expirado') ||
    normalizedMessage.includes('token de autorizacion requerido') ||
    normalizedMessage.includes('sesion expiro') ||
    normalizedMessage.includes('autorizacion requerido')
  );
}

function readErrorMessage(error: HttpErrorResponse): string | null {
  const response = error.error as { readonly message?: unknown } | null;

  return typeof response?.message === 'string' ? response.message : null;
}

function normalizeMessage(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
