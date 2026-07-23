import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { RUTA_INICIO, moduloDeRuta, puedeAcceder } from '@/lib/modulos'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Permisos por módulo: ocultar el ítem del menú no basta, hay que cerrar
  // también la URL directa. Los permisos viajan en el token (ver lib/auth.ts).
  const pathname = req.nextUrl.pathname
  const rol = (token.role as string) || ''
  const permisos = (token.permisos as string[] | undefined) ?? null

  if (!puedeAcceder(pathname, rol, permisos)) {
    const inicio = new URL(RUTA_INICIO, req.url)
    inicio.searchParams.set('sinAcceso', moduloDeRuta(pathname)?.key || 'modulo')
    return NextResponse.redirect(inicio)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
