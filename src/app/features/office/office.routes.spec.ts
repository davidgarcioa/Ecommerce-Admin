import { routes } from './office.routes';

describe('office routes', () => {
  it('keeps all order management routes inside Oficina', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'pendientes',
      'pedidos/:id',
      'pedidos/:id/editar',
      'pedidos/:id/historial',
    ]);
  });

  it('does not expose separate sidebar modules as feature routes', () => {
    expect(routes.some((route) => route.path?.startsWith('clientes'))).toBe(false);
    expect(routes.some((route) => route.path?.startsWith('servicio'))).toBe(false);
  });
});
