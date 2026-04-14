import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const etapaSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  costo: z.number(),
  orden: z.number(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = etapaSchema.parse(body)

    const etapa = await prisma.etapaTratamiento.create({
      data: {
        ...validatedData,
        tratamientoId: params.id,
      },
    })

    return NextResponse.json(etapa, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al crear etapa' }, { status: 500 })
  }
}
