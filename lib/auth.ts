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
          throw new Error('Usuario y contraseña requeridos')
        }

        const usuario = await prisma.usuario.findUnique({
          where: { username: credentials.username }
        })

        if (!usuario || !usuario.activo) {
          throw new Error('Credenciales inválidas')
        }

        const passwordValida = await bcrypt.compare(
          credentials.password,
          usuario.password
        )

        if (!passwordValida) {
          throw new Error('Credenciales inválidas')
        }

        return {
          id: usuario.id,
          username: usuario.username, // Returning username instead of email in user object if needed? 
          // Wait, the NextAuth User type usually expects email? 
          // I should verify what I return. 
          // NextAuth User interface usually has name, email, image.
          // I can map username to name or just add it if I extend the type. 
          // For now, I'll keep email if available, or just not return it if not needed.
          // The previous code returned: email: usuario.email.
          // I'll return email too since it exists.
          email: usuario.email,
          name: `${usuario.nombre} ${usuario.apellido}`,
          role: usuario.rol,
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

