import { routes } from '../../app.routes';
import { APP_NAVIGATION_ITEMS, LEGACY_ROUTE_REDIRECTS } from './navigation.constants';

describe('APP_NAVIGATION_ITEMS', () => {
  it('contains exactly the official sidebar options in order', () => {
    expect(APP_NAVIGATION_ITEMS.map((item) => item.label)).toEqual([
      'Inicio',
      'Dashboard',
      'Campañas',
      'Etiquetas',
      'Testeos',
      'Conjuntos',
      'Gastos',
      'Archivos',
      'Oficina',
      'Torre Logística',
      'Rastreo',
      'Configuración',
    ]);
    expect(APP_NAVIGATION_ITEMS).toHaveLength(12);
  });

  it('does not expose internal concepts as main navigation items', () => {
    const labels = APP_NAVIGATION_ITEMS.map((item) => item.label);

    expect(labels).not.toContain('Productos');
    expect(labels).not.toContain('Pedidos');
    expect(labels).not.toContain('Inventario');
    expect(labels).not.toContain('Reportes');
    expect(labels).not.toContain('Usuarios');
    expect(labels).not.toContain('Entregas');
    expect(labels).not.toContain('Devoluciones');
  });

  it('uses the official public routes', () => {
    expect(APP_NAVIGATION_ITEMS.map((item) => item.route)).toEqual([
      '/inicio',
      '/dashboard',
      '/campanas',
      '/etiquetas',
      '/testeos',
      '/conjuntos',
      '/gastos',
      '/archivos/importar',
      '/oficina',
      '/torre-logistica',
      '/rastreo',
      '/configuracion',
    ]);
  });
});

describe('legacy route redirects', () => {
  it('keeps redirects for old visible routes', () => {
    expect(LEGACY_ROUTE_REDIRECTS).toEqual(
      expect.arrayContaining([
        { path: 'product-groups', redirectTo: 'conjuntos' },
        { path: 'expenses', redirectTo: 'gastos' },
        { path: 'expenses/:id', redirectTo: 'gastos/:id' },
        { path: 'egresos', redirectTo: 'gastos' },
        { path: 'products', redirectTo: 'conjuntos' },
        { path: 'orders', redirectTo: 'oficina' },
        { path: 'users', redirectTo: 'configuracion/usuarios' },
        { path: 'reports', redirectTo: 'dashboard' },
      ]),
    );
  });

  it('redirects root to inicio inside the admin layout', () => {
    const adminRoute = routes.find((route) => route.path === '');
    const rootChild = adminRoute?.children?.find((route) => route.path === '');

    expect(rootChild).toMatchObject({
      path: '',
      pathMatch: 'full',
      redirectTo: 'inicio',
    });
  });
});
