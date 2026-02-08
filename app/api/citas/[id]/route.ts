import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const citaUpdateSchema = z.object({
  fecha: z.string().optional(),
  hora: z.string().optional(),
  motivo: z.string().optional(),
  notas: z.string().optional(),
  estado: z.enum([
    'PROGRAMADA', 'CONFIRMADA', 'EN_CURSO',
    'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'
  ]).optional(),
  odontologoId: z.string().optional(),
  pacienteId: z.string().optional(),
  duracion: z.number().positive().optional(),
}).strict()

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
    const validatedData = citaUpdateSchema.parse(body)

    const cita = await prisma.cita.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        fecha: validatedData.fecha ? new Date(validatedData.fecha) : undefined,
      },
      include: {
        paciente: true,
        odontologo: true,
      },
    })

    return NextResponse.json(cita)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
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

