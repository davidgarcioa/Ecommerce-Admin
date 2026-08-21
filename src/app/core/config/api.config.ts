import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  readonly baseUrl: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    baseUrl: resolveApiBaseUrl(),
  }),
});

function resolveApiBaseUrl(): string {
  const configuredUrl = readConfiguredApiUrl();
  if (configuredUrl) {
    return normalizeApiUrl(configuredUrl);
  }

  const location = globalThis.location;
  const hostname = location?.hostname ?? '';
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  return isLocalHost ? 'http://localhost:3000/api' : `${location.origin}/api`;
}

function readConfiguredApiUrl(): string | null {
  const runtimeConfig = globalThis as typeof globalThis & {
    __ECOMMERCE_API_BASE_URL__?: string;
  };

  return runtimeConfig.__ECOMMERCE_API_BASE_URL__?.trim() || null;
}

function normalizeApiUrl(value: string): string {
  return value.replace(/\/+$/, '');
}
