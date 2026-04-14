import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.findUnique({
      where: { username }
    })

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const passwordValida = await bcrypt.compare(password, usuario.password)

    if (!passwordValida) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Retornar datos del usuario (el token será manejado por NextAuth en el cliente)
    return NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      }
    })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error en login' },
      { status: 500 }
    )
  }
}
