import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const procedimientoSchema = z.object({
  expedienteId: z.string(),
  odontologoId: z.string(),
  fecha: z.string().optional(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  diente: z.string().nullable().optional(),
  precio: z.number().min(0),
  duracion: z.number().int().min(0).nullable().optional(),
  materiales: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
})

// POST - Crear procedimiento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = procedimientoSchema.parse(body)

    const procedimiento = await prisma.procedimiento.create({
      data: {
        expedienteId: validated.expedienteId,
        odontologoId: validated.odontologoId,
        fecha: validated.fecha ? new Date(validated.fecha) : undefined,
        nombre: validated.nombre,
        descripcion: validated.descripcion || '',
        diente: validated.diente || null,
        precio: validated.precio,
        duracion: validated.duracion ?? null,
        materiales: validated.materiales ?? null,
        observaciones: validated.observaciones ?? null,
      },
    })

    return NextResponse.json(procedimiento, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear procedimiento:', error)
    return NextResponse.json(
      { error: 'Error al crear procedimiento' },
      { status: 500 }
    )
  }
}

const procedimientoUpdateSchema = z.object({
  id: z.string(),
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  diente: z.string().nullable().optional(),
  precio: z.number().min(0).optional(),
  duracion: z.number().int().min(0).nullable().optional(),
  materiales: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
})

// PUT - Actualizar procedimiento
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = procedimientoUpdateSchema.parse(body)

    const procedimiento = await prisma.procedimiento.update({
      where: { id: validated.id },
      data: {
        ...(validated.nombre !== undefined && { nombre: validated.nombre }),
        ...(validated.descripcion !== undefined && { descripcion: validated.descripcion }),
        ...(validated.diente !== undefined && { diente: validated.diente }),
        ...(validated.precio !== undefined && { precio: validated.precio }),
        ...(validated.duracion !== undefined && { duracion: validated.duracion }),
        ...(validated.materiales !== undefined && { materiales: validated.materiales }),
        ...(validated.observaciones !== undefined && { observaciones: validated.observaciones }),
      },
    })

    return NextResponse.json(procedimiento)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar procedimiento:', error)
    return NextResponse.json(
      { error: 'Error al actualizar procedimiento' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar procedimiento
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await prisma.procedimiento.delete({ where: { id } })
    return NextResponse.json({ message: 'Procedimiento eliminado' })
  } catch (error) {
    console.error('Error al eliminar procedimiento:', error)
    return NextResponse.json(
      { error: 'Error al eliminar procedimiento' },
      { status: 500 }
    )
  }
}


