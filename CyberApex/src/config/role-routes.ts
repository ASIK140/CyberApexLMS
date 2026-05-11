export const ROLE_ROUTES: Record<string, string> = {
  super_admin:  '/admin',
  ciso:         '/ciso',
  tenant_admin: '/tenant-admin',
  employee:     '/employee',
  student:      '/student',
};

export const DEFAULT_ROUTE = '/';

export function getRouteForRole(role: string | undefined): string {
  if (!role) return DEFAULT_ROUTE;
  return ROLE_ROUTES[role] ?? DEFAULT_ROUTE;
}