import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const expedienteSchema = z.object({
  pacienteId: z.string(),
  diagnostico: z.string().min(1, 'Diagnóstico requerido').max(10000),
  tratamiento: z.string().min(1, 'Tratamiento requerido').max(10000),
  evolucion: z.string().max(10000).optional(),
  proximaCita: z.string().optional(),
  odontograma: z.string().max(500000).optional(),
})

// GET - Obtener expedientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get('pacienteId')

    const where: any = {}
    if (pacienteId) {
      where.pacienteId = pacienteId
    }

    const expedientes = await prisma.expediente.findMany({
      where,
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
            identificacion: true,
          },
        },
        procedimientos: {
          include: {
            odontologo: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        imagenes: true,
      },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(expedientes)
  } catch (error) {
    console.error('Error al obtener expedientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener expedientes' },
      { status: 500 }
    )
  }
}

// POST - Crear expediente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = expedienteSchema.parse(body)

    const expediente = await prisma.expediente.create({
      data: {
        pacienteId: validatedData.pacienteId,
        diagnostico: validatedData.diagnostico,
        tratamiento: validatedData.tratamiento,
        evolucion: validatedData.evolucion || null,
        proximaCita: validatedData.proximaCita ? new Date(validatedData.proximaCita) : null,
        odontograma: validatedData.odontograma || null,
      },
      include: {
        paciente: true,
      },
    })

    return NextResponse.json(expediente, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear expediente:', error)
    return NextResponse.json(
      { error: 'Error al crear expediente' },
      { status: 500 }
    )
  }
}

