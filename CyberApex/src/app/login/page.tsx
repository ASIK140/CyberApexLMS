'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/utils/api';
import { getRouteForRole } from '@/config/role-routes';

export default function LoginPage() {
  const router = useRouter();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter both email and password.'); return; }

    setLoading(true);
    try {
      // Use the new v1 auth endpoint which correctly queries the Prisma database and Argon2 hashes
      const { data: json } = await apiClient.post('/v1/auth/login', { email, password });

      if (!json.data) {
        throw new Error('Login failed.');
      }

      const { accessToken, refreshToken, user } = json.data;

      // Update Zustand store
      setAccessToken(accessToken);
      setUser({
        id:       user.id,
        email:    user.email,
        firstName: user.firstName || 'User',
        lastName:  user.lastName || '',
        role:     user.role as any,
        tenantId: user.tenantId ?? null,
      });

      // Persist refresh token for the interceptor fallback
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('refreshToken', refreshToken || '');
      }

      // Set cookies so Next.js middleware can check role/auth without Zustand
      const cookieAge = 86400; // 24 h — matches legacy JWT expiry
      document.cookie = `role=${user.role}; path=/; max-age=${cookieAge}; SameSite=Lax`;
      document.cookie = `loggedIn=1; path=/; max-age=${cookieAge}; SameSite=Lax`;

      const route = getRouteForRole(user.role);
      router.push(route);
    } catch (e: any) {
      // Prefer the server-side message; fall back to the generic network message
      const msg =
        e.response?.data?.message ??
        e.response?.data?.error?.message ??
        e.message ??
        'Invalid credentials.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #000 100%)' }}>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 tracking-tight">
          CyberApex LMS
        </h1>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Sign in to your account</h2>
        <p className="mt-2 text-sm text-slate-400">Enterprise Cybersecurity Training &amp; Phishing Sandbox</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-cyan-900/20 sm:rounded-2xl sm:px-10 border border-slate-200">

          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email" name="email" type="text" autoComplete="username" required
                placeholder="admin@sa-lms.dev"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                Remember me
              </label>
              <a href="#" className="text-sm font-medium text-cyan-600 hover:text-cyan-500">Forgot password?</a>
            </div>

            <button
              type="submit" disabled={loading}
              className="flex w-full justify-center rounded-lg border border-transparent bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 px-4 text-sm font-bold text-white shadow-sm hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 transition-all"
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">Or continue with SSO</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a href="#" className="inline-flex w-full justify-center rounded-md border border-slate-200 bg-slate-50 py-2 px-4 text-sm font-bold text-blue-600 shadow-sm hover:bg-slate-100 transition">
                OKTA
              </a>
              <a href="#" className="inline-flex w-full justify-center rounded-md border border-slate-200 bg-slate-50 py-2 px-4 text-sm font-bold text-blue-500 shadow-sm hover:bg-slate-100 transition">
                Azure AD
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
