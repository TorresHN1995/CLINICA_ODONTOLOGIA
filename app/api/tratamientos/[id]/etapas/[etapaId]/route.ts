import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const etapaUpdateSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  costo: z.number().min(0, 'El costo no puede ser negativo').optional(),
  completada: z.boolean().optional(),
})

// Recalcula el costoTotal del tratamiento como la suma de los costos de sus etapas
async function recalcularCostoTotal(tratamientoId: string) {
  const agg = await prisma.etapaTratamiento.aggregate({
    where: { tratamientoId },
    _sum: { costo: true },
  })
  await prisma.tratamiento.update({
    where: { id: tratamientoId },
    data: { costoTotal: agg._sum.costo ?? 0 },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; etapaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = etapaUpdateSchema.parse(body)

    const etapa = await prisma.etapaTratamiento.update({
      where: { id: params.etapaId },
      data: {
        ...validatedData,
        // Registrar la fecha al marcar/desmarcar como completada
        ...(validatedData.completada !== undefined && {
          fechaCompletada: validatedData.completada ? new Date() : null,
        }),
      },
    })

    // Si cambió el costo, mantener sincronizado el costoTotal del tratamiento
    if (validatedData.costo !== undefined) {
      await recalcularCostoTotal(params.id)
    }

    return NextResponse.json(etapa)
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
  { params }: { params: { id: string; etapaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.etapaTratamiento.delete({
      where: { id: params.etapaId },
    })

    // Recalcular el costo total del tratamiento tras eliminar la etapa
    await recalcularCostoTotal(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
