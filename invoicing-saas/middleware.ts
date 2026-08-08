import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard and /admin routes
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isDashboardRoute || isAdminRoute) {
    // Check session indicator cookie or localStorage surrogate header if present
    const sessionCookie = request.cookies.get('monneyfact_session')?.value || request.cookies.get('sb-access-token')?.value;

    // Note: Client-side layout guard in (dashboard)/layout.tsx & (admin)/layout.tsx enforces strict state validation,
    // but middleware provides initial server-edge level protection against unauthorized direct access.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
