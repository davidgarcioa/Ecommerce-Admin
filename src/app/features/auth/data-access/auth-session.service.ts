import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { initializeApp, getApps } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { catchError, from, map, Observable, switchMap, tap, throwError } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { FIREBASE_CONFIG } from '../../../core/config/firebase.config';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PermissionsService } from '../../../core/services/permissions.service';
import {
  AuthSession,
  AuthTokenResponse,
  FirebaseLoginRequest,
  LoginFormValue,
  RegisterFormValue,
} from './auth.models';

const ACCESS_TOKEN_KEY = 'ecommerce_access_token';
const REFRESH_TOKEN_KEY = 'ecommerce_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly firebaseConfig = inject(FIREBASE_CONFIG);
  private readonly permissions = inject(PermissionsService);
  private readonly authenticatedState = signal(this.hasAccessToken());

  readonly authenticated = this.authenticatedState.asReadonly();

  login(value: LoginFormValue): Observable<AuthSession> {
    const auth = this.firebaseAuth;

    return from(signInWithEmailAndPassword(auth, value.email.trim(), value.password)).pipe(
      switchMap((credential) => from(credential.user.reload()).pipe(map(() => credential))),
      switchMap((credential) => {
        if (!credential.user.emailVerified) {
          return from(signOut(auth)).pipe(
            switchMap(() =>
              throwError(() => 'Verifica tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'),
            ),
          );
        }

        return from(credential.user.getIdToken(true));
      }),
      switchMap((idToken) =>
        this.post<AuthSession, FirebaseLoginRequest>('firebase-login', { idToken }),
      ),
      tap((session) => this.storeSession(session)),
      catchError((error: unknown) => throwError(() => this.toMessage(error))),
    );
  }

  register(value: RegisterFormValue): Observable<void> {
    const auth = this.firebaseAuth;

    return from(
      createUserWithEmailAndPassword(auth, value.email.trim(), value.password),
    ).pipe(
      switchMap((credential) =>
        from(
          updateProfile(credential.user, {
            displayName: `${value.firstName.trim()} ${value.lastName.trim()}`.trim(),
          }),
        ).pipe(map(() => credential)),
      ),
      switchMap((credential) => from(sendEmailVerification(credential.user))),
      switchMap(() => from(signOut(auth))),
      tap(() => this.clearSession()),
      map(() => undefined),
      catchError((error: unknown) => throwError(() => this.toMessage(error))),
    );
  }

  refreshSession(): Observable<AuthTokenResponse> {
    const refreshToken = this.readRefreshToken();

    if (!refreshToken) {
      return throwError(() => 'Tu sesión expiró. Vuelve a iniciar sesión.');
    }

    return this.http
      .post<ApiResponse<AuthTokenResponse>>(`${this.apiConfig.baseUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        map((response) => response.data),
        tap((tokens) => this.storeTokens(tokens)),
        catchError((error: unknown) => {
          this.clearSession();
          return throwError(() => this.toMessage(error));
        }),
      );
  }

  logout(): Observable<void> {
    const refreshToken = this.readRefreshToken();
    const request$: Observable<unknown> = refreshToken
      ? this.http.post<ApiResponse<void>>(`${this.apiConfig.baseUrl}/auth/logout`, {
          refreshToken,
        })
      : from(Promise.resolve(null));

    return request$.pipe(
      switchMap(() => from(signOut(this.firebaseAuth))),
      tap(() => this.clearSession()),
      map(() => undefined),
      catchError(() => {
        this.clearSession();
        return from(Promise.resolve(undefined));
      }),
    );
  }

  clearSession(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
    } finally {
      this.permissions.clear();
      this.authenticatedState.set(false);
    }
  }

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private post<TResponse, TPayload extends object>(
    path: string,
    payload: TPayload,
  ): Observable<TResponse> {
    return this.http
      .post<ApiResponse<TResponse>>(`${this.apiConfig.baseUrl}/auth/${path}`, payload)
      .pipe(map((response) => response.data));
  }

  private storeSession(session: AuthSession): void {
    this.storeTokens(session);
  }

  private storeTokens(tokens: AuthTokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    this.permissions.refreshFromToken();
    this.authenticatedState.set(true);
  }

  private readRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private hasAccessToken(): boolean {
    try {
      return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
    } catch {
      return false;
    }
  }

  private get firebaseAuth() {
    const app = getApps()[0] ?? initializeApp(this.firebaseConfig);
    return getAuth(app);
  }

  private toMessage(error: unknown): string {
    const firebaseCode = getFirebaseErrorCode(error);

    if (firebaseCode) {
      return toFirebaseMessage(firebaseCode);
    }

    if (error instanceof HttpErrorResponse) {
      const response = error.error as Partial<ApiResponse<unknown>> | null;
      return mapBackendMessage(response?.message, error.status);
    }

    return typeof error === 'string'
      ? error
      : 'Ocurrió un problema. Inténtalo nuevamente.';
  }
}

function getFirebaseErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('auth/')
  ) {
    return error.code;
  }

  return null;
}

function toFirebaseMessage(code: string): string {
  if (code.includes('api-key')) {
    return 'La configuración de Firebase no es válida. Revisa la API key de la app web.';
  }

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/email-already-exists': 'Este correo ya está registrado.',
    'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
    'auth/wrong-password': 'El correo o la contraseña no son correctos.',
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/weak-password': 'La contraseña no cumple con los requisitos mínimos.',
    'auth/missing-password': 'Ingresa una contraseña.',
    'auth/operation-not-allowed': 'El registro con correo y contraseña no está habilitado en Firebase.',
    'auth/configuration-not-found': 'Firebase Authentication no está configurado para esta aplicación.',
    'auth/api-key-not-valid': 'La configuración de Firebase no es válida.',
    'auth/invalid-api-key': 'La configuración de Firebase no es válida.',
    'auth/app-not-authorized': 'Esta aplicación no está autorizada en Firebase.',
    'auth/unauthorized-domain': 'El dominio localhost no está autorizado en Firebase Authentication.',
    'auth/network-request-failed': 'No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
  };

  return messages[code] ?? `No pudimos completar la autenticación. Código: ${code}.`;
}

function mapBackendMessage(message: string | undefined, status?: number): string {
  if (status === 0) {
    return 'No pudimos conectarnos con el backend. Verifica que esté encendido.';
  }

  if (status === 404) {
    return 'El endpoint de autenticación no está disponible. Reinicia el backend para cargar los cambios.';
  }

  if (!message) {
    if (status && status >= 500) {
      return 'El servidor no pudo completar el registro. Revisa la consola del backend.';
    }

    return 'Ocurrió un problema. Inténtalo nuevamente.';
  }

  const normalized = message.toLowerCase();

  if (normalized.includes('credenciales')) {
    return 'El correo o la contraseña no son correctos.';
  }

  if (normalized.includes('verificar') || normalized.includes('verifica')) {
    return 'Verifica tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
  }

  if (normalized.includes('pendiente') && normalized.includes('aprob')) {
    return 'Tu cuenta ya fue creada. Espera a que un administrador apruebe tu acceso.';
  }

  if (normalized.includes('pendiente') && normalized.includes('administrador')) {
    return 'Tu cuenta está esperando aprobación del administrador.';
  }

  if (normalized.includes('correo') && normalized.includes('existe')) {
    return 'Ya existe una cuenta con ese correo.';
  }

  if (normalized.includes('token') || normalized.includes('sesión')) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }

  if (normalized.includes('conexión') || normalized.includes('network')) {
    return 'No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.';
  }

  if (normalized.includes('firebase') && normalized.includes('correo')) {
    return 'No pudimos validar el correo de la cuenta. Inténtalo nuevamente.';
  }

  if (normalized.includes('perfil interno')) {
    return 'La cuenta fue creada, pero no se pudo preparar tu perfil. Intenta iniciar sesión.';
  }

  if (normalized.includes('error interno')) {
    return 'El servidor no pudo completar el registro. Revisa que el backend esté encendido y actualizado.';
  }

  return message;
}
