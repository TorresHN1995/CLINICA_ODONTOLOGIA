import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// PUT - Actualizar cita
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

    // Si se está actualizando el estado
    if (body.estado) {
      const cita = await prisma.cita.update({
        where: { id: params.id },
        data: { estado: body.estado },
        include: {
          paciente: true,
          odontologo: true,
        },
      })
      return NextResponse.json(cita)
    }

    // Actualización completa
    const cita = await prisma.cita.update({
      where: { id: params.id },
      data: {
        ...body,
        fecha: body.fecha ? new Date(body.fecha) : undefined,
      },
      include: {
        paciente: true,
        odontologo: true,
      },
    })

    return NextResponse.json(cita)
  } catch (error) {
    console.error('Error al actualizar cita:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cita' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar cita
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const cita = await prisma.cita.update({
      where: { id: params.id },
      data: { estado: 'CANCELADA' },
    })

    return NextResponse.json(cita)
  } catch (error) {
    console.error('Error al cancelar cita:', error)
    return NextResponse.json(
      { error: 'Error al cancelar cita' },
      { status: 500 }
    )
  }
}

