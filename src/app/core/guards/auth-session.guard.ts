import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

export const authSessionGuard: CanMatchFn = () => {
  const router = inject(Router);
  return hasAccessToken() ? true : router.createUrlTree(['/auth']);
};

function hasAccessToken(): boolean {
  try {
    return Boolean(localStorage.getItem('ecommerce_access_token'));
  } catch {
    return false;
  }
}
