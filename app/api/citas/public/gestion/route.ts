import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { z } from 'zod'
import { addMinutes, format } from 'date-fns'

const gestionSchema = z.object({
    accion: z.enum(['CANCELAR', 'REPROGRAMAR']),
    citaId: z.string(),
    identificacion: z.string().max(50),
    motivo: z.string().max(2000).optional(),
    nuevaFecha: z.string().optional(),
    nuevaHora: z.string().optional(),
})

export async function POST(request: NextRequest) {
    // Rate limit: 10 gestiones por minuto por IP
    const key = getRateLimitKey(request)
    const { success } = rateLimit(`public-gestion:${key}`, 10, 60 * 1000)
    if (!success) {
        return NextResponse.json(
            { error: 'Demasiadas solicitudes. Intente de nuevo en un momento.' },
            { status: 429 }
        )
    }

    try {
        const body = await request.json()
        const data = gestionSchema.parse(body)

        // 1. Verificar propiedad de la cita (Seguridad)
        // El usuario provee Identidad + CitaID, verificamos que matchen en BD
        const cita = await prisma.cita.findUnique({
            where: { id: data.citaId },
            include: { paciente: true }
        })

        if (!cita) {
            return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
        }

        if (cita.paciente.identificacion !== data.identificacion) {
            return NextResponse.json({ error: 'No autorizado para gestionar esta cita' }, { status: 403 })
        }

        if (data.accion === 'CANCELAR') {
            if (!data.motivo) return NextResponse.json({ error: 'Motivo requerido' }, { status: 400 })

            await prisma.cita.update({
                where: { id: data.citaId },
                data: {
                    estado: 'CANCELADA',
                    observaciones: (cita.observaciones || '') + `\n[Cancelada por Paciente]: ${data.motivo}`
                }
            })

            return NextResponse.json({ success: true, message: 'Cita cancelada correctamente' })
        }

        if (data.accion === 'REPROGRAMAR') {
            if (!data.nuevaFecha || !data.nuevaHora) {
                return NextResponse.json({ error: 'Fecha y hora requeridas' }, { status: 400 })
            }

            const fechaDate = new Date(`${data.nuevaFecha}T${data.nuevaHora}`)
            const duracion = cita.duracion
            const horaFin = format(addMinutes(fechaDate, duracion), 'HH:mm')

            // 2. Validar Disponibilidad (Igual que al crear)
            const nuevaFechaDate = new Date(data.nuevaFecha)
            const inicioDelDia = new Date(nuevaFechaDate)
            inicioDelDia.setHours(0, 0, 0, 0)
            const finDelDia = new Date(nuevaFechaDate)
            finDelDia.setHours(23, 59, 59, 999)

            // Odontólogo
            const colisionOdontologo = await prisma.cita.findFirst({
                where: {
                    id: { not: cita.id }, // Excluir misma cita
                    fecha: {
                        gte: inicioDelDia,
                        lte: finDelDia
                    },
                    horaInicio: data.nuevaHora,
                    estado: { not: 'CANCELADA' },
                    odontologoId: cita.odontologoId
                }
            })

            if (colisionOdontologo) {
                return NextResponse.json({ error: 'El horario seleccionado no está disponible.' }, { status: 409 })
            }

            // Paciente
            const colisionPaciente = await prisma.cita.findFirst({
                where: {
                    id: { not: cita.id }, // Excluir misma cita
                    pacienteId: cita.pacienteId,
                    fecha: {
                        gte: inicioDelDia,
                        lte: finDelDia
                    },
                    estado: { not: 'CANCELADA' },
                    horaInicio: data.nuevaHora
                }
            })

            if (colisionPaciente) {
                return NextResponse.json({ error: 'Ya tienes otra cita en ese horario.' }, { status: 409 })
            }

            await prisma.cita.update({
                where: { id: data.citaId },
                data: {
                    fecha: new Date(data.nuevaFecha),
                    horaInicio: data.nuevaHora,
                    horaFin: horaFin,
                    estado: 'PROGRAMADA', // Reset estado si estaba NO_ASISTIO etc
                    observaciones: (cita.observaciones || '') + `\n[Reprogramada por Paciente]`
                }
            })

            return NextResponse.json({ success: true, message: 'Cita reprogramada correctamente' })
        }

        return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
        }
        console.error('Error gestión citas:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
