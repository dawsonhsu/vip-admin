import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const WINWINWIN_COOKIE = 'winwinwin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/winwinwin') return NextResponse.next();

  const hasCookie = Boolean(request.cookies.get(WINWINWIN_COOKIE)?.value);
  if (!hasCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/winwinwin';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/winwinwin/:path*'],
};
