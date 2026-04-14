import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

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
          }
        } catch (error) {
          console.error('Error en authorize:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
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

