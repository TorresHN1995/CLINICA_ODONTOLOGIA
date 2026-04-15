import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const pacienteSchema = z.object({
  identificacion: z.string().min(1).max(50),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  fechaNacimiento: z.string().refine((val) => {
    const date = new Date(val)
    return !isNaN(date.getTime()) && date < new Date()
  }, 'Fecha de nacimiento inválida o futura'),
  email: z.string().email().max(200).optional().or(z.literal('')),
  telefono: z.string().min(1).max(30),
  celular: z.string().max(30).optional(),
  direccion: z.string().max(300).optional(),
  ciudad: z.string().max(100).optional(),
  ocupacion: z.string().max(100).optional(),
  contactoEmergencia: z.string().max(200).optional(),
  telefonoEmergencia: z.string().max(30).optional(),
  alergias: z.string().max(2000).optional(),
  medicamentos: z.string().max(2000).optional(),
  enfermedades: z.string().max(2000).optional(),
  observaciones: z.string().max(5000).optional(),
})

// GET - Obtener un paciente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: params.id },
      include: {
        citas: {
          take: 10,
          orderBy: { fecha: 'desc' },
          include: {
            odontologo: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        expedientes: {
          take: 5,
          orderBy: { fecha: 'desc' },
        },
        tratamientos: {
          orderBy: { createdAt: 'desc' },
        },
        facturas: {
          take: 10,
          orderBy: { fecha: 'desc' },
        },
      },
    })

    if (!paciente) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(paciente)
  } catch (error) {
    console.error('Error al obtener paciente:', error)
    return NextResponse.json(
      { error: 'Error al obtener paciente' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar paciente
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
    const validatedData = pacienteSchema.parse(body)

    const paciente = await prisma.paciente.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        fechaNacimiento: new Date(validatedData.fechaNacimiento),
        email: validatedData.email || null,
      },
    })

    return NextResponse.json(paciente)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar paciente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar paciente' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar (desactivar) paciente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Soft delete - solo desactivamos el paciente
    const paciente = await prisma.paciente.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json(paciente)
  } catch (error) {
    console.error('Error al eliminar paciente:', error)
    return NextResponse.json(
      { error: 'Error al eliminar paciente' },
      { status: 500 }
    )
  }
}

