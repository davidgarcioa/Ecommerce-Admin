import { routes } from './expenses.routes';

describe('expenses routes', () => {
  it('replaces the placeholder with lazy pages', () => {
    expect(routes.map((route) => route.path)).toEqual(['', 'nuevo', ':id/editar', ':id']);
    expect(routes[0].loadComponent).toBeDefined();
  });
});
