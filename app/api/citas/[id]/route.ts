import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const citaUpdateSchema = z.object({
  fecha: z.string().optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm').optional(),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm').optional(),
  motivo: z.string().max(2000).optional(),
  observaciones: z.string().max(5000).optional(),
  estado: z.enum([
    'PROGRAMADA', 'CONFIRMADA', 'EN_CURSO',
    'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'
  ]).optional(),
  odontologoId: z.string().optional(),
  pacienteId: z.string().optional(),
  duracion: z.number().int().positive().optional(),
})

// Función auxiliar para convertir hora a minutos
const horaAMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

// PUT - Actualizar cita
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
    const validatedData = citaUpdateSchema.parse(body)

    // Obtener cita actual para datos de referencia
    const citaActual = await prisma.cita.findUnique({
      where: { id: params.id },
    })

    if (!citaActual) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
    }

    // Si se cambia fecha, hora u odontólogo, verificar conflictos
    const fechaCambia = validatedData.fecha || validatedData.horaInicio || validatedData.horaFin || validatedData.odontologoId
    if (fechaCambia) {
      const fechaFinal = validatedData.fecha ? new Date(validatedData.fecha) : citaActual.fecha
      const horaInicioFinal = validatedData.horaInicio || citaActual.horaInicio
      const horaFinFinal = validatedData.horaFin || citaActual.horaFin
      const odontologoFinal = validatedData.odontologoId || citaActual.odontologoId

      const citasExistentes = await prisma.cita.findMany({
        where: {
          id: { not: params.id },
          odontologoId: odontologoFinal,
          fecha: fechaFinal,
          estado: { not: 'CANCELADA' },
        },
      })

      const horaInicioNueva = horaAMinutos(horaInicioFinal)
      const horaFinNueva = horaAMinutos(horaFinFinal)

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
    }

    const cita = await prisma.cita.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        fecha: validatedData.fecha ? new Date(validatedData.fecha) : undefined,
      },
      include: {
        paciente: true,
        odontologo: true,
      },
    })

    return NextResponse.json(cita)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error al actualizar cita:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cita' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar cita
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const cita = await prisma.cita.update({
      where: { id: params.id },
      data: { estado: 'CANCELADA' },
    })

    return NextResponse.json(cita)
  } catch (error) {
    console.error('Error al cancelar cita:', error)
    return NextResponse.json(
      { error: 'Error al cancelar cita' },
      { status: 500 }
    )
  }
}

