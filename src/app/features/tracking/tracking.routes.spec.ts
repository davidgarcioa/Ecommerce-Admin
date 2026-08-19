import { LEGACY_ROUTE_REDIRECTS } from '../../core/constants/navigation.constants';
import { routes } from './tracking.routes';

describe('tracking routes', () => {
  it('keeps tracking routes under Rastreo', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'pedido/:orderId',
      'guia/:trackingNumber',
      'entrega/:deliveryId',
    ]);
  });

  it('redirects legacy tracking paths', () => {
    expect(LEGACY_ROUTE_REDIRECTS).toContainEqual({ path: 'tracking', redirectTo: 'rastreo' });
    expect(LEGACY_ROUTE_REDIRECTS).toContainEqual({
      path: 'tracking/:id',
      redirectTo: 'rastreo/pedido/:id',
    });
    expect(LEGACY_ROUTE_REDIRECTS).toContainEqual({ path: 'seguimiento', redirectTo: 'rastreo' });
  });
});
