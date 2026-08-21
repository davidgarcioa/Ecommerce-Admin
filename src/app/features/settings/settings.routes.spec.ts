import { routes } from './settings.routes';

describe('settings routes', () => {
  it('keeps only profile inside settings', () => {
    const childRoutes = routes[0]?.children?.map((route) => route.path);

    expect(childRoutes).toEqual(['', 'perfil', '**']);
  });

  it('protects profile with permissions', () => {
    const profileRoute = routes[0]?.children?.find((route) => route.path === 'perfil');

    expect(profileRoute?.canMatch?.length).toBe(1);
    expect(Array.isArray(profileRoute?.data?.['permissions'])).toBe(true);
  });
});
