import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

/**
 * Middleware para validar autenticación
 * Soporta tanto sesiones de NextAuth como tokens Bearer
 */
export async function validateAuth(request: NextRequest) {
  // Primero intentar obtener sesión de NextAuth
  const session = await getServerSession(authOptions)
  
  if (session) {
    return session
  }

  // Si no hay sesión, intentar obtener token Bearer
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  // Por ahora, retornar null si no hay sesión
  // En producción, aquí se validaría el JWT token
  return null
}

/**
 * Wrapper para proteger endpoints
 */
export async function withAuth(
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const session = await validateAuth(request)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    return handler(request, session)
  }
}
