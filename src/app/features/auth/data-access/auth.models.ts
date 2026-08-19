import { PermissionCode } from '../../../core/services/permissions.service';

export interface AuthUser {
  readonly id: string;
  readonly uid: string;
  readonly email: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName?: string;
  readonly avatar?: string;
  readonly phone?: string;
  readonly roleId: string;
  readonly permissions: readonly PermissionCode[];
  readonly active: boolean;
  readonly emailVerified: boolean;
  readonly lastLogin?: string;
}

export interface AuthTokenResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: string;
}

export interface AuthSession extends AuthTokenResponse {
  readonly user: AuthUser;
}

export interface FirebaseLoginRequest {
  readonly idToken: string;
}

export interface FirebaseRegisterRequest extends FirebaseLoginRequest {
  readonly firstName: string;
  readonly lastName: string;
}

export interface LoginFormValue {
  readonly email: string;
  readonly password: string;
}

export interface RegisterFormValue extends LoginFormValue {
  readonly firstName: string;
  readonly lastName: string;
}
