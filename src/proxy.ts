import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('FATAL: JWT_SECRET is missing.')
  }
  return new TextEncoder().encode(secretKey);
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // 1. Preview Lock Logic
  if (process.env.ENABLE_PREVIEW_LOCK === 'true') {
    const isPreviewRoute = url.pathname.startsWith('/preview');
    const hasPreviewAccess = request.cookies.has('preview_access');
    
    if (!hasPreviewAccess && !isPreviewRoute) {
      url.pathname = '/preview';
      return NextResponse.redirect(url);
    }
  }

  // 2. JWT Session Logic (Endast för /course routes)
  if (url.pathname.startsWith('/course')) {
    const session = request.cookies.get('session')?.value;

    if (!session) {
      return NextResponse.redirect(new URL('/login?error=middleware_no_session', request.url));
    }

    try {
      await jwtVerify(session, getKey());
      // All good, continue
    } catch {
      return NextResponse.redirect(new URL('/login?error=middleware_jwt_fail', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}
