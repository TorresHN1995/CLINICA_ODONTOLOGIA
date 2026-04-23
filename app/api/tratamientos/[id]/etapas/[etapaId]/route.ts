import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const etapaUpdateSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  costo: z.number().optional(),
  completada: z.boolean().optional(),
  fechaCompletada: z.string().optional(),
  observaciones: z.string().optional(),
})

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

    const { fechaCompletada, ...otherData } = validatedData
    
    const etapa = await prisma.etapaTratamiento.update({
      where: { id: params.etapaId },
      data: {
        ...otherData,
        ...(fechaCompletada !== undefined && { fechaCompletada: fechaCompletada ? new Date(fechaCompletada) : null }),
      },
    })

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
