import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET - Obtener tratamiento por ID
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
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            identificacion: true,
          },
        },
        etapas: {
          orderBy: { orden: 'asc' },
        },
      },
    })

    if (!tratamiento) {
      return NextResponse.json({ error: 'Tratamiento no encontrado' }, { status: 404 })
    }

    return NextResponse.json(tratamiento)
  } catch (error) {
    console.error('Error al obtener tratamiento:', error)
    return NextResponse.json(
      { error: 'Error al obtener tratamiento' },
      { status: 500 }
    )
  }
}

const updateTratamientoSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  estado: z
    .enum(['PLANIFICADO', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO'])
    .optional(),
  fechaInicio: z.string().nullable().optional(),
  fechaFin: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
})

// PUT - Actualizar tratamiento (parcial)
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
    const validated = updateTratamientoSchema.parse(body)

    const dataUpdate: any = {
      ...(validated.nombre !== undefined && { nombre: validated.nombre }),
      ...(validated.descripcion !== undefined && { descripcion: validated.descripcion }),
      ...(validated.estado !== undefined && { estado: validated.estado }),
      ...(validated.observaciones !== undefined && { observaciones: validated.observaciones }),
      ...(validated.fechaInicio !== undefined && {
        fechaInicio: validated.fechaInicio ? new Date(validated.fechaInicio) : null,
      }),
      ...(validated.fechaFin !== undefined && {
        fechaFin: validated.fechaFin ? new Date(validated.fechaFin) : null,
      }),
    }

    const tratamiento = await prisma.tratamiento.update({
      where: { id: params.id },
      data: dataUpdate,
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true, identificacion: true } },
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
    console.error('Error al actualizar tratamiento:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tratamiento' },
      { status: 500 }
    )
  }
}


