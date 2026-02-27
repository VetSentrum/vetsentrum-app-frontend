import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const pathname = req.nextUrl.pathname

  const isAuthRoute = pathname.startsWith('/login')
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/usuarios') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/mascotas') ||
    pathname.startsWith('/citas') ||
    pathname.startsWith('/consultas')

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/usuarios/:path*',
    '/clientes/:path*',
    '/mascotas/:path*',
    '/citas/:path*',
    '/consultas/:path*',
  ],
}