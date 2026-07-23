import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { parsePermisos, permisosEfectivos } from './modulos'

/** Cada cuánto se releen los permisos desde la BD sin obligar a cerrar sesión.
 *  Un minuto: es una consulta pequeña y hace que un cambio de permisos se note
 *  casi enseguida, sin que el usuario tenga que volver a entrar. */
const REFRESCO_PERMISOS_MS = 60 * 1000

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const usuario = await prisma.usuario.findUnique({
            where: { username: credentials.username }
          })

          if (!usuario || !usuario.activo) {
            return null
          }

          const passwordValida = await bcrypt.compare(
            credentials.password,
            usuario.password
          )

          if (!passwordValida) {
            return null
          }

          return {
            id: usuario.id,
            username: usuario.username,
            email: usuario.email,
            name: `${usuario.nombre} ${usuario.apellido}`,
            role: usuario.rol,
            permisos: permisosEfectivos(usuario.rol, parsePermisos(usuario.permisos)),
          }
        } catch (error) {
          console.error('Error en authorize:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.permisos = user.permisos || []
        token.permisosAt = Date.now()
        return token
      }

      // Los permisos viven en el token, así que un cambio hecho por el
      // administrador no se vería hasta el siguiente login. Se releen desde la
      // BD cada pocos minutos (o de inmediato si la sesión pide actualizarse)
      // para que el acceso se ajuste sin obligar a cerrar sesión.
      const vencido = Date.now() - ((token.permisosAt as number) || 0) > REFRESCO_PERMISOS_MS
      if (token.id && (trigger === 'update' || vencido)) {
        try {
          const actual = await prisma.usuario.findUnique({
            where: { id: token.id as string },
            select: { rol: true, permisos: true, activo: true },
          })
          if (actual?.activo) {
            token.role = actual.rol
            token.permisos = permisosEfectivos(actual.rol, parsePermisos(actual.permisos))
          }
          token.permisosAt = Date.now()
        } catch (error) {
          // Si la BD falla se conservan los permisos que ya trae el token.
          console.error('No se pudieron refrescar los permisos:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        // Si el token todavía no trae permisos (sesión abierta antes de esta
        // función, o refresco fallido) se cae al preset del rol en vez de dejar
        // al usuario sin menú.
        session.user.permisos =
          (token.permisos as string[] | undefined) ??
          permisosEfectivos(token.role as string, null)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Si la URL es una ruta relativa, úsala
      if (url.startsWith('/')) return url
      // Si la URL es del mismo dominio, permite la redirección
      try {
        const urlObj = new URL(url)
        if (urlObj.origin === baseUrl) return url
      } catch (e) {
        // URL inválida, ignorar
      }
      // Por defecto, redirigir al dashboard
      return '/dashboard'
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

