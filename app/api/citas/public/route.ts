import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { parseFechaLocal, inicioDiaLocal, finDiaLocal } from '@/lib/fecha'
import { asignarOdontologo, profesionalesAtendiendo } from '@/lib/asignacion-odontologo'
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
                    fechaNacimiento: parseFechaLocal(validatedData.paciente.fechaNacimiento),
                    // Valores por defecto
                    direccion: 'Registrado Online',
                }
            })
        } else {
            // Opcional: Actualizar datos si ya existe? Por ahora solo usamos el ID.
        }

        // 2. Calcular el rango de la cita
        const fechaDate = new Date(`${validatedData.fecha}T${validatedData.hora}`)
        const duracion = 60 // Default 60 mins
        const horaFin = format(addMinutes(fechaDate, duracion), 'HH:mm')

        // 3. Asignar odontólogo automáticamente: el paciente no elige profesional
        // en la web, así que se le da uno que esté libre en ese horario (el de
        // menor carga ese día) y se le informa en la respuesta.
        const asignacion = await asignarOdontologo({
            fecha: validatedData.fecha,
            horaInicio: validatedData.hora,
            horaFin,
        })

        if (!asignacion) {
            const hayProfesionales = (await profesionalesAtendiendo()).length > 0
            return NextResponse.json(
                {
                    error: hayProfesionales
                        ? 'Ese horario acaba de ocuparse. Elige otra hora, por favor.'
                        : 'No hay odontólogos disponibles en el sistema.'
                },
                { status: hayProfesionales ? 409 : 500 }
            )
        }

        const odontologo = asignacion.profesional

        // Verificar colisión de PACIENTE (Para evitar citas duplicadas)
        const colisionPaciente = await prisma.cita.findFirst({
            where: {
                fecha: {
                    gte: inicioDiaLocal(validatedData.fecha),
                    lte: finDiaLocal(validatedData.fecha)
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
                fecha: parseFechaLocal(validatedData.fecha),
                horaInicio: validatedData.hora,
                horaFin: horaFin,
                duracion: duracion,
                tipoCita: 'CONSULTA', // Default para web booking, se puede refinar
                motivo: validatedData.motivo,
                observaciones: 'Reserva Online',
                estado: 'PROGRAMADA'
            }
        })

        // Se devuelve el profesional asignado para poder mostrárselo al paciente
        // en la confirmación: es el dato que antes no aparecía por ningún lado.
        return NextResponse.json(
            {
                ...nuevaCita,
                odontologo: {
                    id: odontologo.id,
                    nombre: odontologo.nombre,
                    apellido: odontologo.apellido,
                },
                // Sin «Dr./Dra.»: el sistema no guarda el género del profesional y
                // deducirlo del nombre llevaría a tratar mal a alguien.
                mensaje: `Te atenderá ${odontologo.nombre} ${odontologo.apellido}.`,
            },
            { status: 201 }
        )

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
        }
        console.error('Error creando cita pública:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
