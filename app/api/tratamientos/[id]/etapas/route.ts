import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const etapaUpdateSchema = z.object({
  id: z.string(),
  nombre: z.string().optional(),
  descripcion: z.string().nullable().optional(),
  costo: z.number().min(0).optional(),
  completada: z.boolean().optional(),
  orden: z.number().int().min(1).optional(),
})

// PUT - Actualizar varias etapas (toggle/update/reordenar)
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
    const etapas = z.array(etapaUpdateSchema).parse(body?.etapas || [])

    const updates = etapas.map(etapa =>
      prisma.etapaTratamiento.update({
        where: { id: etapa.id },
        data: {
          ...(etapa.nombre !== undefined && { nombre: etapa.nombre }),
          ...(etapa.descripcion !== undefined && { descripcion: etapa.descripcion }),
          ...(etapa.costo !== undefined && { costo: etapa.costo }),
          ...(etapa.completada !== undefined && {
            completada: etapa.completada,
            fechaCompletada: etapa.completada ? new Date() : null,
          }),
          ...(etapa.orden !== undefined && { orden: etapa.orden }),
        },
      })
    )

    await prisma.$transaction(updates)

    const tratamiento = await prisma.tratamiento.findUnique({
      where: { id: params.id },
      include: { etapas: { orderBy: { orden: 'asc' } } },
    })

    return NextResponse.json(tratamiento)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar etapas:', error)
    return NextResponse.json(
      { error: 'Error al actualizar etapas' },
      { status: 500 }
    )
  }
}


