import { Injectable } from '@angular/core';

const HOME_QUICK_ACCESS_PREFERENCES_PREFIX = 'ecommerce_home_quick_access';

@Injectable({ providedIn: 'root' })
export class HomePreferencesService {
  readQuickAccessIds(userKey: string): readonly string[] | null {
    try {
      const raw = localStorage.getItem(this.quickAccessKey(userKey));
      if (!raw) return null;

      const parsed = JSON.parse(raw) as readonly string[];
      return parsed.filter((itemId) => typeof itemId === 'string');
    } catch {
      return null;
    }
  }

  saveQuickAccessIds(userKey: string, ids: readonly string[]): void {
    try {
      localStorage.setItem(this.quickAccessKey(userKey), JSON.stringify(ids));
    } catch {
      // Preferences are optional; Inicio must work even when storage is unavailable.
    }
  }

  private quickAccessKey(userKey: string): string {
    return `${HOME_QUICK_ACCESS_PREFERENCES_PREFIX}_${userKey}`;
  }
}
