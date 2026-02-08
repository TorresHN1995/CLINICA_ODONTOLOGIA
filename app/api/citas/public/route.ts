import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { z } from 'zod'
import { addMinutes, format } from 'date-fns'

const bookingSchema = z.object({
    fecha: z.string(), // YYYY-MM-DD
    hora: z.string(), // HH:mm
    motivo: z.string(),
    paciente: z.object({
        nombre: z.string().min(2),
        apellido: z.string().min(2),
        identificacion: z.string().min(5),
        telefono: z.string().min(8),
        email: z.string().email().optional().or(z.literal('')),
        fechaNacimiento: z.string(), // YYYY-MM-DD
    })
})

export async function POST(request: NextRequest) {
    // Rate limit: 5 bookings per minute per IP
    const key = getRateLimitKey(request)
    const { success } = rateLimit(`public-cita:${key}`, 5, 60 * 1000)
    if (!success) {
        return NextResponse.json(
            { error: 'Demasiadas solicitudes. Intente de nuevo en un momento.' },
            { status: 429 }
        )
    }

    try {
        const body = await request.json()
        const validatedData = bookingSchema.parse(body)

        // 1. Buscar o Crear Paciente
        let paciente = await prisma.paciente.findUnique({
            where: { identificacion: validatedData.paciente.identificacion }
        })

        if (!paciente) {
            paciente = await prisma.paciente.create({
                data: {
                    identificacion: validatedData.paciente.identificacion,
                    nombre: validatedData.paciente.nombre,
                    apellido: validatedData.paciente.apellido,
                    telefono: validatedData.paciente.telefono,
                    email: validatedData.paciente.email || null,
                    fechaNacimiento: new Date(validatedData.paciente.fechaNacimiento),
                    // Valores por defecto
                    direccion: 'Registrado Online',
                }
            })
        } else {
            // Opcional: Actualizar datos si ya existe? Por ahora solo usamos el ID.
        }

        // 2. Asignar Odontólogo (Por ahora asignamos al primer usuario ODONTOLOGO o ADMINISTRADOR disponible)
        // En el futuro esto podría venir del frontend si seleccionan doctor.
        const odontologo = await prisma.usuario.findFirst({
            where: {
                rol: { in: ['ODONTOLOGO', 'ADMINISTRADOR'] },
                activo: true
            }
        })

        if (!odontologo) {
            return NextResponse.json({ error: 'No hay odontólogos disponibles en el sistema.' }, { status: 500 })
        }

        // 3. Crear Cita
        const fechaDate = new Date(`${validatedData.fecha}T${validatedData.hora}`)
        const duracion = 60 // Default 60 mins
        const horaFin = format(addMinutes(fechaDate, duracion), 'HH:mm')

        // Verificar colisión doble check (concurrencia básica)
        // Verificar colisión de ODONTÓLOGO
        const colisionOdontologo = await prisma.cita.findFirst({
            where: {
                fecha: {
                    gte: new Date(validatedData.fecha),
                    lt: addMinutes(new Date(validatedData.fecha), 24 * 60)
                },
                horaInicio: validatedData.hora,
                estado: { not: 'CANCELADA' },
                odontologoId: odontologo.id
            }
        })

        if (colisionOdontologo) {
            return NextResponse.json({ error: 'El horario seleccionado ya no está disponible.' }, { status: 409 })
        }

        // Verificar colisión de PACIENTE (Para evitar citas duplicadas)
        const colisionPaciente = await prisma.cita.findFirst({
            where: {
                fecha: {
                    gte: new Date(validatedData.fecha),
                    lt: addMinutes(new Date(validatedData.fecha), 24 * 60)
                },
                horaInicio: validatedData.hora,
                estado: { not: 'CANCELADA' },
                pacienteId: paciente.id
            }
        })

        if (colisionPaciente) {
            return NextResponse.json({ error: 'Ya tienes una cita agendada para este horario.' }, { status: 409 })
        }

        const nuevaCita = await prisma.cita.create({
            data: {
                pacienteId: paciente.id,
                odontologoId: odontologo.id,
                fecha: new Date(validatedData.fecha),
                horaInicio: validatedData.hora,
                horaFin: horaFin,
                duracion: duracion,
                tipoCita: 'CONSULTA', // Default para web booking, se puede refinar
                motivo: validatedData.motivo,
                observaciones: 'Reserva Online',
                estado: 'PROGRAMADA'
            }
        })

        return NextResponse.json(nuevaCita, { status: 201 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
        }
        console.error('Error creando cita pública:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
