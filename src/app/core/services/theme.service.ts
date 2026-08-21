import { computed, Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'ecommerce-control-center.theme';
const DEFAULT_THEME: AppTheme = 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeState = signal<AppTheme>(this.readStoredTheme());

  readonly theme = this.themeState.asReadonly();
  readonly isLight = computed(() => this.themeState() === 'light');
  readonly nextThemeLabel = computed(() =>
    this.isLight() ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro',
  );
  readonly nextThemeIcon = computed(() => (this.isLight() ? 'dark_mode' : 'light_mode'));

  constructor() {
    this.applyTheme(this.themeState());
  }

  toggleTheme(): void {
    this.setTheme(this.isLight() ? 'dark' : 'light');
  }

  setTheme(theme: AppTheme): void {
    this.themeState.set(theme);
    this.persistTheme(theme);
    this.applyTheme(theme);
  }

  private readStoredTheme(): AppTheme {
    try {
      const storedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
      return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  private persistTheme(theme: AppTheme): void {
    try {
      globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      return;
    }
  }

  private applyTheme(theme: AppTheme): void {
    const root = globalThis.document?.documentElement;
    if (!root) return;

    root.dataset['theme'] = theme;
    root.style.colorScheme = theme;
  }
}
