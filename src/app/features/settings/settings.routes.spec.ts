import { routes } from './settings.routes';

describe('settings routes', () => {
  it('keeps users, roles and permissions inside settings', () => {
    const childRoutes = routes[0]?.children?.map((route) => route.path);

    expect(childRoutes).toEqual([
      '',
      'perfil',
      'usuarios',
      'usuarios/nuevo',
      'usuarios/:id',
      'usuarios/:id/editar',
      'roles',
      'roles/nuevo',
      'roles/:id',
      'roles/:id/editar',
      'permisos',
    ]);
  });

  it('protects administrative child routes with permissions', () => {
    const childRoutes = routes[0]?.children?.filter((route) => route.path !== '');

    expect(childRoutes?.every((route) => route.canMatch?.length === 1)).toBe(true);
    expect(childRoutes?.every((route) => Array.isArray(route.data?.['permissions']))).toBe(true);
  });
});
