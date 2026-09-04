import { Injectable, signal } from '@angular/core';

const ACCESS_TOKEN_KEY = 'ecommerce_access_token';
const ANONYMOUS_SCOPE = 'anonymous';

@Injectable({ providedIn: 'root' })
export class AccountStorageService {
  private readonly scopeState = signal(readScopeFromToken());

  readonly scope = this.scopeState.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === ACCESS_TOKEN_KEY) {
          this.refreshFromSession();
        }
      });
    }
  }

  refreshFromSession(): void {
    this.scopeState.set(readScopeFromToken());
  }

  key(baseKey: string): string {
    return `${baseKey}.account.${this.scope()}`;
  }

  getItem(baseKey: string): string | null {
    try {
      return globalThis.localStorage?.getItem(this.key(baseKey)) ?? null;
    } catch {
      return null;
    }
  }

  setItem(baseKey: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(this.key(baseKey), value);
    } catch {
      return;
    }
  }

  removeItem(baseKey: string): void {
    try {
      globalThis.localStorage?.removeItem(this.key(baseKey));
    } catch {
      return;
    }
  }
}

export function readCurrentAccountScope(): string {
  return readScopeFromToken();
}

export function accountScopedStorageKey(baseKey: string): string {
  return `${baseKey}.account.${readCurrentAccountScope()}`;
}

function readScopeFromToken(): string {
  try {
    const token = globalThis.localStorage?.getItem(ACCESS_TOKEN_KEY);
    const payload = token ? decodeTokenPayload(token) : null;
    const rawScope =
      payload?.['uid'] ?? payload?.['sub'] ?? payload?.['user_id'] ?? payload?.['email'];

    return normalizeScope(rawScope);
  } catch {
    return ANONYMOUS_SCOPE;
  }
}

function decodeTokenPayload(token: string): Record<string, string> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );
    const decoded = JSON.parse(atob(paddedPayload)) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(decoded).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return null;
  }
}

function normalizeScope(value: string | undefined): string {
  const normalized = (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._@-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || ANONYMOUS_SCOPE;
}
