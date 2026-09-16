import { Injectable } from '@angular/core';

type WarmupWindow = typeof globalThis & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

type WarmupTask = () => Promise<unknown>;

const WARMUP_DELAY_MS = 180;
const WARMUP_IDLE_TIMEOUT_MS = 1800;
const ADMIN_PAGE_WARMUPS: readonly { readonly route: string; readonly load: WarmupTask }[] = [
  { route: '/inicio', load: () => import('../../features/home/pages/home-page/home-page') },
  {
    route: '/dashboard',
    load: () => import('../../features/dashboard/pages/dashboard-page/dashboard-page'),
  },
  { route: '/oficina', load: () => import('../../features/office/pages/office-page/office-page') },
  {
    route: '/campanas',
    load: () => import('../../features/campaigns/pages/campaigns-page/campaigns-page'),
  },
  {
    route: '/torre-logistica',
    load: () => import('../../features/logistics/pages/logistics-tower-page/logistics-tower-page'),
  },
  {
    route: '/gastos',
    load: () => import('../../features/expenses/pages/expenses-page/expenses-page'),
  },
  {
    route: '/etiquetas',
    load: () => import('../../features/labels/pages/labels-page/labels-page'),
  },
  {
    route: '/conjuntos',
    load: () =>
      import('../../features/product-groups/pages/product-groups-page/product-groups-page'),
  },
  {
    route: '/testeos',
    load: () => import('../../features/testing/pages/testing-page/testing-page'),
  },
  {
    route: '/rastreo',
    load: () => import('../../features/tracking/pages/tracking-page/tracking-page'),
  },
  {
    route: '/archivos/importar',
    load: () => import('../../features/files/pages/files-page/files-page'),
  },
  {
    route: '/archivos',
    load: () => import('../../features/files/pages/files-manager-page/files-manager-page'),
  },
];

@Injectable({ providedIn: 'root' })
export class NavigationWarmupService {
  private started = false;
  private readonly loadedRoutes = new Set<string>();

  warmupAdminPages(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }

    this.started = true;
    this.runSequentially(ADMIN_PAGE_WARMUPS);
  }

  warmupRoute(route: string): void {
    const warmup = this.findWarmup(route);

    if (!warmup) {
      return;
    }

    void this.loadOnce(warmup.route, warmup.load);
  }

  private runSequentially(
    tasks: readonly { readonly route: string; readonly load: WarmupTask }[],
    index = 0,
  ): void {
    const task = tasks[index];

    if (!task) {
      return;
    }

    this.whenIdle(() => {
      void this.loadOnce(task.route, task.load).finally(() =>
        this.runSequentially(tasks, index + 1),
      );
    });
  }

  private async loadOnce(route: string, task: WarmupTask): Promise<void> {
    if (this.loadedRoutes.has(route)) {
      return;
    }

    this.loadedRoutes.add(route);

    try {
      await task();
    } catch {
      this.loadedRoutes.delete(route);
    }
  }

  private findWarmup(
    route: string,
  ): { readonly route: string; readonly load: WarmupTask } | undefined {
    return ADMIN_PAGE_WARMUPS.find((warmup) => route.startsWith(warmup.route));
  }

  private whenIdle(callback: () => void): void {
    window.setTimeout(() => {
      const warmupWindow = globalThis as WarmupWindow;

      if (typeof warmupWindow.requestIdleCallback === 'function') {
        warmupWindow.requestIdleCallback(callback, { timeout: WARMUP_IDLE_TIMEOUT_MS });
        return;
      }

      callback();
    }, WARMUP_DELAY_MS);
  }
}
