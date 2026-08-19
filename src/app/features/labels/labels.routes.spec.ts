import { routes } from './labels.routes';

describe('labels routes', () => {
  it('exposes only the official etiquetas child routes', () => {
    expect(routes.map((route) => route.path)).toEqual(['', 'nueva', ':id/editar', ':id']);
  });
});
