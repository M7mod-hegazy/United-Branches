import { NextRequest, NextResponse } from 'next/server'
import { sessionOptions } from '@/lib/session'

export function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === '/admin/login'
  const hasSessionCookie = request.cookies.has(sessionOptions.cookieName)

  if (!isLogin && !hasSessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
