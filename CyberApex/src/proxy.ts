import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC = ['/login', '/reset-password', '/_next', '/favicon', '/api'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Root → login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Require auth cookie (set by login page on success)
  const loggedIn = request.cookies.get('loggedIn')?.value;
  if (!loggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
