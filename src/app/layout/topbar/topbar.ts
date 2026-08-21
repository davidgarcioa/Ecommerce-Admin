import { Component, computed, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { APP_NAVIGATION_ITEMS } from '../../core/constants/navigation.constants';
import { NAVIGATION_PERMISSIONS } from '../../core/constants/navigation-permissions.constants';
import { LayoutStateService } from '../../core/services/layout-state.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthSessionService } from '../../features/auth/data-access/auth-session.service';

interface TopbarSearchResult {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly layoutState = inject(LayoutStateService);
  private readonly authSession = inject(AuthSessionService);
  private readonly permissions = inject(PermissionsService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  readonly toggleSidebar = output<void>();
  readonly title = this.layoutState.activeTitle;
  readonly breadcrumbs = this.layoutState.breadcrumbs;
  readonly isHomeRoute = this.layoutState.isHomeRoute;
  readonly searchQuery = signal('');
  readonly searchOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly themeToggleLabel = this.theme.nextThemeLabel;
  readonly themeToggleIcon = this.theme.nextThemeIcon;
  readonly searchResults = computed<readonly TopbarSearchResult[]>(() => {
    const query = normalizeSearchText(this.searchQuery());
    const allowedItems = APP_NAVIGATION_ITEMS.filter((item) => {
      const requiredPermissions = NAVIGATION_PERMISSIONS[item.id];
      return item.visible && (!requiredPermissions || this.permissions.hasAny(requiredPermissions));
    });

    if (!query) return allowedItems;

    return allowedItems.filter((item) =>
      normalizeSearchText(`${item.label} ${item.id} ${item.route}`).includes(query),
    );
  });

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.authSession.logout().subscribe({
      complete: () => this.loggingOut.set(false),
    });
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.searchOpen.set(true);
  }

  openSearch(): void {
    this.searchOpen.set(true);
  }

  closeSearch(): void {
    window.setTimeout(() => this.searchOpen.set(false), 120);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchOpen.set(false);
  }

  navigateToResult(result: TopbarSearchResult): void {
    this.clearSearch();
    void this.router.navigate([result.route]);
  }

  navigateToFirstResult(): void {
    const firstResult = this.searchResults()[0];
    if (firstResult) {
      this.navigateToResult(firstResult);
    }
  }
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
