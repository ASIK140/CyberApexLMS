import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → silent refresh → retry
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect if we got HTML instead of JSON (likely a redirect or 404)
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
        console.error('API returned HTML instead of JSON. Possible redirect or 404.');
        return Promise.reject(new Error('API returned HTML instead of JSON. Please check if you are logged in.'));
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Never attempt token refresh when the failing request is itself an auth endpoint
      const reqUrl = (originalRequest.url || '').toLowerCase();
      if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/refresh') || reqUrl.includes('/auth/logout')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 1. Try v1 refresh via httpOnly cookie (RS256 tokens from v1 auth)
        let newToken: string | null = null;
        try {
          const { data } = await axios.post(`${BASE}/v1/auth/refresh`, {}, { withCredentials: true });
          newToken = data.data.accessToken;
        } catch {
          // 2. Fall back to legacy refresh via sessionStorage token (HS256 tokens from legacy auth)
          const legacyRefreshToken = typeof window !== 'undefined' ? sessionStorage.getItem('refreshToken') : null;
          if (legacyRefreshToken) {
            const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: legacyRefreshToken }, { withCredentials: true });
            newToken = data.data?.token ?? data.data?.accessToken ?? null;
          }
        }
        if (!newToken) throw new Error('Token refresh failed');
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('refreshToken');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * @deprecated Use apiClient instead for new v1 endpoints
 * Improved to handle non-JSON responses gracefully.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url        = endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`;
  const token      = useAuthStore.getState().accessToken;
  const isFormData = options.body instanceof FormData;
  const headers    = {
    // Do NOT set Content-Type for FormData — browser must set it with the multipart boundary
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  } as Record<string, string>;

  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  
  // Check content type
  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          console.error(`API returned HTML instead of JSON for ${endpoint}. Status: ${res.status}`);
          throw new Error(`Server returned an error page (HTML) instead of JSON. Status: ${res.status}. Please check backend logs.`);
      }
      // If it's not HTML but also not JSON, try to return it as a fake JSON if it's just a message
      return {
          ok: res.ok,
          status: res.status,
          json: async () => ({ success: res.ok, message: text }),
          text: async () => text
      } as any;
  }
  
  return res;
}
