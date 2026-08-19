import { routes } from './product-groups.routes';

describe('product groups routes', () => {
  it('defines official child routes without exposing products as a root section', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'nuevo',
      ':id/editar',
      ':id/productos',
      ':id',
    ]);
  });
});
