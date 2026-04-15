import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const citaSchema = z.object({
  pacienteId: z.string(),
  odontologoId: z.string(),
  fecha: z.string(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)'),
  duracion: z.number().int().positive('Duración debe ser positiva'),
  tipoCita: z.enum([
    'CONSULTA',
    'LIMPIEZA',
    'EXTRACCION',
    'ENDODONCIA',
    'ORTODONCIA',
    'PROTESIS',
    'CIRUGIA',
    'CONTROL',
    'EMERGENCIA',
    'OTRO'
  ]),
  motivo: z.string().max(2000).optional(),
  observaciones: z.string().max(5000).optional(),
})

// GET - Obtener citas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const pacienteId = searchParams.get('pacienteId')
    const odontologoId = searchParams.get('odontologoId')
    const estado = searchParams.get('estado')

    const where: any = {}

    // Prioridad a rango de fechas, sino fecha única
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      }
    } else if (fecha) {
      const fechaDate = new Date(fecha)
      fechaDate.setHours(0, 0, 0, 0)
      const fechaFinDia = new Date(fecha)
      fechaFinDia.setHours(23, 59, 59, 999)

      where.fecha = {
        gte: fechaDate,
        lte: fechaFinDia,
      }
    }

    if (pacienteId) {
      where.pacienteId = pacienteId
    }

    if (odontologoId) {
      where.odontologoId = odontologoId
    }

    if (estado) {
      where.estado = estado
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
          },
        },
        odontologo: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: [
        { fecha: 'asc' },
        { horaInicio: 'asc' },
      ],
    })

    return NextResponse.json(citas)
  } catch (error) {
    console.error('Error al obtener citas:', error)
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cita
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = citaSchema.parse(body)

    // Verificar que el paciente esté activo
    const paciente = await prisma.paciente.findUnique({
      where: { id: validatedData.pacienteId },
      select: { activo: true },
    })
    if (!paciente || !paciente.activo) {
      return NextResponse.json(
        { error: 'El paciente no existe o está inactivo' },
        { status: 400 }
      )
    }

    // Función auxiliar para convertir hora a minutos
    const horaAMinutos = (hora: string) => {
      const [h, m] = hora.split(':').map(Number)
      return h * 60 + m
    }

    // Verificar que no haya conflictos de horario
    const citasExistentes = await prisma.cita.findMany({
      where: {
        odontologoId: validatedData.odontologoId,
        fecha: new Date(validatedData.fecha),
        estado: {
          not: 'CANCELADA',
        },
      },
    })

    const horaInicioNueva = horaAMinutos(validatedData.horaInicio)
    const horaFinNueva = horaAMinutos(validatedData.horaFin)

    for (const cita of citasExistentes) {
      const horaInicioCita = horaAMinutos(cita.horaInicio)
      const horaFinCita = horaAMinutos(cita.horaFin)

      if (
        (horaInicioNueva >= horaInicioCita && horaInicioNueva < horaFinCita) ||
        (horaFinNueva > horaInicioCita && horaFinNueva <= horaFinCita) ||
        (horaInicioNueva <= horaInicioCita && horaFinNueva >= horaFinCita)
      ) {
        return NextResponse.json(
          { error: 'El odontólogo ya tiene una cita en este horario' },
          { status: 400 }
        )
      }
    }

    // Verificar duplicidad de PACIENTE
    const citasPaciente = await prisma.cita.findFirst({
      where: {
        pacienteId: validatedData.pacienteId,
        fecha: new Date(validatedData.fecha),
        estado: { not: 'CANCELADA' },
        // Check estricto de hora
        horaInicio: validatedData.horaInicio
      }
    })

    if (citasPaciente) {
      return NextResponse.json(
        { error: 'El paciente ya tiene una cita agendada a esta hora' },
        { status: 400 }
      )
    }

    const cita = await prisma.cita.create({
      data: {
        ...validatedData,
        fecha: new Date(validatedData.fecha),
      },
      include: {
        paciente: true,
        odontologo: true,
      },
    })

    return NextResponse.json(cita, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al crear cita:', error)
    return NextResponse.json(
      { error: 'Error al crear cita' },
      { status: 500 }
    )
  }
}

