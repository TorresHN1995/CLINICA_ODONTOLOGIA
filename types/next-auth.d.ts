import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      /** Keys de los módulos a los que tiene acceso (ver lib/modulos.ts). */
      permisos: string[]
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    permisos?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    permisos?: string[]
    /** Momento del último refresco de permisos desde la BD. */
    permisosAt?: number
  }
}
