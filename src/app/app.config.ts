import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  RouteReuseStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { AdminRouteReuseStrategy } from './core/routing/admin-route-reuse.strategy';
import { IdlePreloadingStrategy } from './core/routing/idle-preloading.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    { provide: RouteReuseStrategy, useClass: AdminRouteReuseStrategy },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(IdlePreloadingStrategy),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      }),
    ),
  ],
};
