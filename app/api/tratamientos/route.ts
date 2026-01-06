import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const etapaSchema = z.object({
  nombre: z.string(),
  descripcion: z.string().optional(),
  costo: z.number().positive(),
})

const tratamientoSchema = z.object({
  pacienteId: z.string(),
  nombre: z.string().min(1),
  descripcion: z.string(),
  fechaInicio: z.string().optional(),
  observaciones: z.string().optional(),
  etapas: z.array(etapaSchema),
})

// GET - Obtener tratamientos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get('pacienteId')
    const estado = searchParams.get('estado')

    const where: any = {}
    if (pacienteId) where.pacienteId = pacienteId
    if (estado) where.estado = estado

    const tratamientos = await prisma.tratamiento.findMany({
      where,
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
            identificacion: true,
          },
        },
        etapas: {
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tratamientos)
  } catch (error) {
    console.error('Error al obtener tratamientos:', error)
    return NextResponse.json(
      { error: 'Error al obtener tratamientos' },
      { status: 500 }
    )
  }
}

// POST - Crear tratamiento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = tratamientoSchema.parse(body)

    // Calcular costo total
    const costoTotal = validatedData.etapas.reduce(
      (sum, etapa) => sum + etapa.costo,
      0
    )

    // Crear tratamiento con etapas
    const tratamiento = await prisma.tratamiento.create({
      data: {
        pacienteId: validatedData.pacienteId,
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        costoTotal,
        fechaInicio: validatedData.fechaInicio ? new Date(validatedData.fechaInicio) : null,
        observaciones: validatedData.observaciones || null,
        etapas: {
          create: validatedData.etapas.map((etapa, index) => ({
            orden: index + 1,
            nombre: etapa.nombre,
            descripcion: etapa.descripcion || null,
            costo: etapa.costo,
          })),
        },
      },
      include: {
        paciente: true,
        etapas: true,
      },
    })

    return NextResponse.json(tratamiento, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear tratamiento:', error)
    return NextResponse.json(
      { error: 'Error al crear tratamiento' },
      { status: 500 }
    )
  }
}

