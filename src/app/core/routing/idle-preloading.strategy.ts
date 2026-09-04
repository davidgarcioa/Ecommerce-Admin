import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

type IdleWindow = typeof globalThis & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

@Injectable({ providedIn: 'root' })
export class IdlePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!route.data?.['preload']) {
      return of(null);
    }

    const delayMs = Number(route.data['preloadDelay'] ?? 0);

    return waitForIdle(delayMs).pipe(mergeMap(load));
  }
}

function waitForIdle(delayMs: number): Observable<void> {
  return new Observable((observer) => {
    const idleWindow = globalThis as IdleWindow;
    let idleId: number | null = null;
    const timeoutId = setTimeout(
      () => {
        const complete = () => {
          observer.next();
          observer.complete();
        };

        if (typeof idleWindow.requestIdleCallback === 'function') {
          idleId = idleWindow.requestIdleCallback(complete, { timeout: 2000 });
          return;
        }

        complete();
      },
      Math.max(0, delayMs),
    );

    return () => {
      clearTimeout(timeoutId);

      if (idleId !== null) {
        idleWindow.cancelIdleCallback?.(idleId);
      }
    };
  });
}
