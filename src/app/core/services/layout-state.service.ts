import { computed, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

import { APP_NAVIGATION_ITEMS } from '../constants/navigation.constants';
import { Breadcrumb } from '../models/breadcrumb.model';
import { NavigationItem } from '../models/navigation-item.model';

const CHILD_BREADCRUMB_LABELS: Readonly<Record<string, string>> = {
  '/archivos/importar': 'Importar archivo',
  '/configuracion/usuarios': 'Usuarios',
  '/configuracion/roles': 'Roles',
  '/configuracion/permisos': 'Permisos',
};

@Injectable({
  providedIn: 'root',
})
export class LayoutStateService {
  private readonly router = inject(Router);
  private readonly collapsedState = signal(false);
  private readonly currentUrlState = signal(this.router.url);

  readonly isSidebarCollapsed = this.collapsedState.asReadonly();

  readonly activeItem = computed<NavigationItem | undefined>(() =>
    this.findNavigationItem(this.currentUrlState()),
  );

  readonly activeTitle = computed(() => this.activeItem()?.label ?? 'Inicio');
  readonly isHomeRoute = computed(() => this.currentUrlState() === '/inicio');

  readonly breadcrumbs = computed<readonly Breadcrumb[]>(() => {
    const currentUrl = this.currentUrlState();

    if (currentUrl === '/inicio' || currentUrl === '/dashboard') {
      return [];
    }

    const activeItem = this.activeItem();
    const breadcrumbs: Breadcrumb[] = [
      {
        label: 'Inicio',
        route: '/inicio',
      },
      {
        label: activeItem?.label ?? 'Página no encontrada',
        route: activeItem?.route ?? currentUrl,
      },
    ];

    const childLabel = CHILD_BREADCRUMB_LABELS[currentUrl];
    if (activeItem && childLabel) {
      breadcrumbs.push({
        label: childLabel,
        route: currentUrl,
      });
    }

    return breadcrumbs;
  });

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrlState.set(
          event instanceof NavigationEnd ? event.urlAfterRedirects : event.url,
        );
      });
  }

  toggleSidebar(): void {
    this.collapsedState.update((isCollapsed) => !isCollapsed);
  }

  syncCurrentUrl(): void {
    this.currentUrlState.set(this.router.url);
  }

  setCurrentUrl(url: string): void {
    this.currentUrlState.set(url);
  }

  private findNavigationItem(url: string): NavigationItem | undefined {
    return APP_NAVIGATION_ITEMS.find(
      (item) => url === item.route || url.startsWith(`${item.route}/`),
    );
  }
}
