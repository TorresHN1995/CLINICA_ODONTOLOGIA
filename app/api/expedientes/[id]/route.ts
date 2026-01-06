import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET - Obtener expediente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const expediente = await prisma.expediente.findUnique({
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
        procedimientos: {
          orderBy: { fecha: 'desc' },
          include: {
            odontologo: { select: { nombre: true, apellido: true } },
          },
        },
        imagenes: true,
      },
    })

    if (!expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(expediente)
  } catch (error) {
    console.error('Error al obtener expediente:', error)
    return NextResponse.json(
      { error: 'Error al obtener expediente' },
      { status: 500 }
    )
  }
}

const updateExpedienteSchema = z.object({
  diagnostico: z.string().optional(),
  tratamiento: z.string().optional(),
  evolucion: z.string().optional(),
  proximaCita: z.string().optional(),
  odontograma: z.string().optional(),
})

// PUT - Actualizar expediente
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
    const validated = updateExpedienteSchema.parse(body)

    const dataUpdate: any = {
      ...(validated.diagnostico !== undefined && { diagnostico: validated.diagnostico }),
      ...(validated.tratamiento !== undefined && { tratamiento: validated.tratamiento }),
      ...(validated.evolucion !== undefined && { evolucion: validated.evolucion || null }),
      ...(validated.odontograma !== undefined && { odontograma: validated.odontograma || null }),
      ...(validated.proximaCita !== undefined && {
        proximaCita: validated.proximaCita ? new Date(validated.proximaCita) : null,
      }),
    }

    const expediente = await prisma.expediente.update({
      where: { id: params.id },
      data: dataUpdate,
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true, identificacion: true } },
        procedimientos: {
          orderBy: { fecha: 'desc' },
          include: { odontologo: { select: { nombre: true, apellido: true } } },
        },
        imagenes: true,
      },
    })

    return NextResponse.json(expediente)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar expediente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar expediente' },
      { status: 500 }
    )
  }
}


