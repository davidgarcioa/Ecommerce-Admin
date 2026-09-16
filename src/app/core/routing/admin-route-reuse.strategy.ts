import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

import { readCurrentAccountScope } from '../services/account-storage.service';

const ANONYMOUS_SCOPE = 'anonymous';
const MAX_CACHED_ROUTES = 12;

@Injectable()
export class AdminRouteReuseStrategy implements RouteReuseStrategy {
  private readonly cachedRoutes = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return this.canCache(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!handle || !this.canCache(route)) {
      return;
    }

    const key = this.cacheKey(route);

    if (this.cachedRoutes.has(key)) {
      this.cachedRoutes.delete(key);
    }

    this.cachedRoutes.set(key, handle);
    this.trimCache();
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.canCache(route) && this.cachedRoutes.has(this.cacheKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!this.canCache(route)) {
      return null;
    }

    const key = this.cacheKey(route);
    const handle = this.cachedRoutes.get(key) ?? null;

    if (handle) {
      this.cachedRoutes.delete(key);
      this.cachedRoutes.set(key, handle);
    }

    return handle;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === current.routeConfig;
  }

  private canCache(route: ActivatedRouteSnapshot): boolean {
    return (
      route.data?.['reuse'] === true &&
      readCurrentAccountScope() !== ANONYMOUS_SCOPE &&
      Object.keys(route.params).length === 0
    );
  }

  private cacheKey(route: ActivatedRouteSnapshot): string {
    const path = route.pathFromRoot
      .flatMap((snapshot) => snapshot.url.map((segment) => segment.path))
      .filter(Boolean)
      .join('/');

    return `${readCurrentAccountScope()}:${route.outlet}:${path || 'inicio'}`;
  }

  private trimCache(): void {
    while (this.cachedRoutes.size > MAX_CACHED_ROUTES) {
      const firstKey = this.cachedRoutes.keys().next().value;

      if (!firstKey) {
        return;
      }

      this.cachedRoutes.delete(firstKey);
    }
  }
}
