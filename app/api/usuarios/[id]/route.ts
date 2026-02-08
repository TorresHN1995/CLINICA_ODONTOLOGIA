import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { activo, nombre, apellido, telefono, rol, password } = body

    const updateData: any = {}
    if (activo !== undefined) updateData.activo = activo
    if (nombre) updateData.nombre = nombre
    if (apellido) updateData.apellido = apellido
    if (telefono !== undefined) updateData.telefono = telefono
    if (rol) updateData.rol = rol
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Soft delete - desactivar usuario
    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: { activo: false },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
