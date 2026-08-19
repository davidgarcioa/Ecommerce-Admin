import { describe, expect, it } from 'vitest';

import { HOME_QUICK_ACCESS_ITEMS } from './home.constants';

describe('home constants', () => {
  it('uses only official module routes and excludes inicio', () => {
    const routes = HOME_QUICK_ACCESS_ITEMS.map((item) => item.route);

    expect(routes).not.toContain('/inicio');
    expect(routes).toEqual([
      '/dashboard',
      '/oficina',
      '/campanas',
      '/torre-logistica',
      '/gastos',
      '/archivos/importar',
      '/rastreo',
      '/conjuntos',
      '/testeos',
      '/etiquetas',
      '/configuracion',
    ]);
  });

  it('defines a permission for every access item', () => {
    expect(HOME_QUICK_ACCESS_ITEMS.every((item) => item.permissions.length > 0)).toBe(true);
  });
});
