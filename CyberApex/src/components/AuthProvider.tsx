'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { apiClient } from '../utils/api';
import { usePathname, useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If we're already authenticated via store (e.g. fast refresh), skip hydrating
    if (useAuthStore.getState().isAuthenticated) {
      setHydrated(true);
      return;
    }

    // Attempt to hydrate from v1 auth cookie
    apiClient.post('/v1/auth/refresh')
      .then(async ({ data }) => {
        const token = data?.data?.accessToken;
        if (token) {
          useAuthStore.getState().setAccessToken(token);
          // In a real scenario, we'd also fetch the user profile here if not in token
        }
      })
      .catch(() => {
        // Hydration failed (no token or expired)
      })
      .finally(() => {
        setHydrated(true);
      });
  }, [pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
