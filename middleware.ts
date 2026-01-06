export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pacientes/:path*',
    '/citas/:path*',
    '/expedientes/:path*',
    '/tratamientos/:path*',
    '/facturacion/:path*',
    '/inventario/:path*',
    '/reportes/:path*',
    '/usuarios/:path*',
  ]
}

