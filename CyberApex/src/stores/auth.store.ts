import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'tenant_admin' | 'ciso' | 'student';
  tenantId: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const TOKEN_KEY = 'ca_access_token';
const USER_KEY  = 'ca_auth_user';

function readSession<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeSession(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    if (value !== null && value !== undefined) {
      sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch { /* storage quota or private-mode errors — non-fatal */ }
}

export const useAuthStore = create<AuthState>(() => {
  // Initialize from sessionStorage so state survives page refreshes and
  // client-side navigations that might re-mount top-level React trees.
  const accessToken = readSession<string | null>(TOKEN_KEY, null);
  const user        = readSession<AuthUser | null>(USER_KEY, null);
  return {
    accessToken,
    user,
    isAuthenticated: !!accessToken,
    setAccessToken(token) {
      writeSession(TOKEN_KEY, token);
      useAuthStore.setState({ accessToken: token, isAuthenticated: !!token });
    },
    setUser(user) {
      writeSession(USER_KEY, user);
      useAuthStore.setState({ user });
    },
    logout() {
      writeSession(TOKEN_KEY, null);
      writeSession(USER_KEY, null);
      useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false });
    },
  };
});

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  return {
    isSuperAdmin:  role === 'super_admin',
    isTenantAdmin: role === 'tenant_admin',
    isCISO:        role === 'ciso',
    isStudent:     role === 'student',
    isAdminLevel:  ['super_admin', 'tenant_admin', 'ciso'].includes(role ?? ''),
  };
};
