import { LEGACY_ROUTE_REDIRECTS } from '../../core/constants/navigation.constants';
import { routes } from './logistics.routes';

describe('logistics routes', () => {
  it('keeps logistics features under Torre Logística', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'pendientes',
      'despachos',
      'despachos/:id',
      'envios/:id',
      'entregas',
      'devoluciones',
      'devoluciones/:id',
      'incidencias',
      'incidencias/:id',
    ]);
  });

  it('redirects legacy logistics paths to approved routes', () => {
    expect(LEGACY_ROUTE_REDIRECTS).toContainEqual({
      path: 'deliveries',
      redirectTo: 'torre-logistica/entregas',
    });
    expect(LEGACY_ROUTE_REDIRECTS).toContainEqual({
      path: 'returns',
      redirectTo: 'torre-logistica/devoluciones',
    });
    expect(LEGACY_ROUTE_REDIRECTS).toContainEqual({
      path: 'shipping',
      redirectTo: 'torre-logistica',
    });
  });
});
