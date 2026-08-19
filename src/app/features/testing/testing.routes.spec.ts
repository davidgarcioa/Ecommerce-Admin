import { routes } from './testing.routes';

describe('testing routes', () => {
  it('exposes only the supported testing child routes', () => {
    expect(routes.map((route) => route.path)).toEqual(['', 'nuevo', ':id/editar', ':id']);
  });
});
