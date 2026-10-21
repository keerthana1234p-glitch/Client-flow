import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('clientflow_session');
  const pathname = request.nextUrl.pathname;

  // Protect client dashboard pages from unauthenticated access
  if (!session?.value) {
    if (
      pathname.startsWith('/pipeline') ||
      pathname.startsWith('/contacts') ||
      pathname.startsWith('/queue')
    ) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pipeline/:path*', '/contacts/:path*', '/queue/:path*'],
};
