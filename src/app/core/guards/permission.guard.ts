import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';

import { PermissionCode, PermissionsService } from '../services/permissions.service';

export const permissionGuard: CanMatchFn = (route: Route, _segments: UrlSegment[]) => {
  const router = inject(Router);
  const permissions = inject(PermissionsService);
  const required = route.data?.['permissions'] as readonly PermissionCode[] | undefined;

  if (!hasAccessToken()) {
    return router.createUrlTree(['/auth']);
  }

  permissions.refreshFromToken();

  if (!required?.length || permissions.hasAny(required)) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};

function hasAccessToken(): boolean {
  try {
    return Boolean(localStorage.getItem('ecommerce_access_token'));
  } catch {
    return false;
  }
}
