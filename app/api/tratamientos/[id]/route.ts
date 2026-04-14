import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tratamientoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  estado: z.enum(['PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO']),
  costoTotal: z.number().optional(),
  observaciones: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tratamiento = await prisma.tratamiento.findUnique({
      where: { id: params.id },
      include: {
        paciente: true,
        etapas: { orderBy: { orden: 'asc' } },
      },
    })

    if (!tratamiento) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    return NextResponse.json(tratamiento)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al obtener tratamiento' }, { status: 500 })
  }
}

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
    const validatedData = tratamientoSchema.parse(body)

    const tratamiento = await prisma.tratamiento.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        paciente: true,
        etapas: { orderBy: { orden: 'asc' } },
      },
    })

    return NextResponse.json(tratamiento)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Eliminar etapas primero
    await prisma.etapaTratamiento.deleteMany({
      where: { tratamientoId: params.id },
    })

    // Luego eliminar tratamiento
    await prisma.tratamiento.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
