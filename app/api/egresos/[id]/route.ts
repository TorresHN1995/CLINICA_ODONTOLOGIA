import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Actualizar egreso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const egreso = await prisma.egreso.update({
      where: { id: params.id },
      data: {
        ...body,
        fecha: body.fecha ? new Date(body.fecha) : undefined,
      },
      include: {
        registrador: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    })

    return NextResponse.json(egreso)
  } catch (error) {
    console.error('Error al actualizar egreso:', error)
    return NextResponse.json(
      { error: 'Error al actualizar egreso' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar egreso
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMINISTRADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.egreso.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Egreso eliminado' })
  } catch (error) {
    console.error('Error al eliminar egreso:', error)
    return NextResponse.json(
      { error: 'Error al eliminar egreso' },
      { status: 500 }
    )
  }
}
