import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const imagenSchema = z.object({
  expedienteId: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable().optional(),
  url: z.string().url(),
  tipo: z.string(),
  tamanio: z.number().int().min(0),
})

// POST - Crear imagen clínica
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = imagenSchema.parse(body)

    const imagen = await prisma.imagenClinica.create({
      data: {
        expedienteId: validated.expedienteId,
        nombre: validated.nombre,
        descripcion: validated.descripcion ?? null,
        url: validated.url,
        tipo: validated.tipo,
        tamanio: validated.tamanio,
      },
    })

    return NextResponse.json(imagen, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear imagen clínica:', error)
    return NextResponse.json(
      { error: 'Error al crear imagen clínica' },
      { status: 500 }
    )
  }
}

const imagenUpdateSchema = z.object({
  id: z.string(),
  nombre: z.string().optional(),
  descripcion: z.string().nullable().optional(),
})

// PUT - Actualizar imagen clínica
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = imagenUpdateSchema.parse(body)

    const imagen = await prisma.imagenClinica.update({
      where: { id: validated.id },
      data: {
        ...(validated.nombre !== undefined && { nombre: validated.nombre }),
        ...(validated.descripcion !== undefined && { descripcion: validated.descripcion }),
      },
    })

    return NextResponse.json(imagen)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar imagen clínica:', error)
    return NextResponse.json(
      { error: 'Error al actualizar imagen clínica' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar imagen clínica
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await prisma.imagenClinica.delete({ where: { id } })
    return NextResponse.json({ message: 'Imagen eliminada' })
  } catch (error) {
    console.error('Error al eliminar imagen clínica:', error)
    return NextResponse.json(
      { error: 'Error al eliminar imagen clínica' },
      { status: 500 }
    )
  }
}


