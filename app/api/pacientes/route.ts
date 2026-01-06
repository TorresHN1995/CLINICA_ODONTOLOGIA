import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const pacienteSchema = z.object({
  identificacion: z.string().min(1, 'Identificación requerida'),
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  fechaNacimiento: z.string(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().min(1, 'Teléfono requerido'),
  celular: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  ocupacion: z.string().optional(),
  contactoEmergencia: z.string().optional(),
  telefonoEmergencia: z.string().optional(),
  alergias: z.string().optional(),
  medicamentos: z.string().optional(),
  enfermedades: z.string().optional(),
  observaciones: z.string().optional(),
})

// GET - Obtener todos los pacientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = search
      ? {
          activo: true,
          OR: [
            { nombre: { contains: search } },
            { apellido: { contains: search } },
            { identificacion: { contains: search } },
            { email: { contains: search } },
            { telefono: { contains: search } },
          ],
        }
      : { activo: true }

    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paciente.count({ where }),
    ])

    return NextResponse.json({
      pacientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener pacientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener pacientes' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo paciente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = pacienteSchema.parse(body)

    // Verificar si ya existe un paciente con esa identificación
    const existente = await prisma.paciente.findUnique({
      where: { identificacion: validatedData.identificacion },
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un paciente con esa identificación' },
        { status: 400 }
      )
    }

    const paciente = await prisma.paciente.create({
      data: {
        ...validatedData,
        fechaNacimiento: new Date(validatedData.fechaNacimiento),
        email: validatedData.email || null,
      },
    })

    return NextResponse.json(paciente, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear paciente:', error)
    return NextResponse.json(
      { error: 'Error al crear paciente' },
      { status: 500 }
    )
  }
}

