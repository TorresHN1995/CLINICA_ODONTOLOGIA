import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, setHours, setMinutes, addMinutes, format, isBefore } from 'date-fns'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fechaParam = searchParams.get('fecha')
        const odontologoId = searchParams.get('odontologoId')

        if (!fechaParam) {
            return NextResponse.json({ error: 'Fecha es requerida' }, { status: 400 })
        }

        const fecha = new Date(fechaParam)
        if (isNaN(fecha.getTime())) {
            return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
        }

        // 1. Definir horario de trabajo (Ej: 8:00 AM - 5:00 PM)
        const startHour = 8
        const endHour = 17
        const slotDuration = 60 // 1 hora por cita default para la web pública

        // 2. Obtener citas existentes para esa fecha
        const citasExistentes = await prisma.cita.findMany({
            where: {
                fecha: {
                    gte: startOfDay(fecha),
                    lte: endOfDay(fecha)
                },
                estado: {
                    not: 'CANCELADA'
                },
                ...(odontologoId ? { odontologoId } : {})
            }
        })

        // 3. Generar slots
        const slots = []
        let currentSlot = setMinutes(setHours(fecha, startHour), 0)
        const endTime = setMinutes(setHours(fecha, endHour), 0)
        const now = new Date()

        while (isBefore(currentSlot, endTime)) {
            const slotEnd = addMinutes(currentSlot, slotDuration)
            const slotTimeStr = format(currentSlot, 'HH:mm')

            // Verificar si el slot está ocupado
            // Una cita choca si empieza antes de que termine el slot Y termina después de que empiece el slot
            const isOccupied = citasExistentes.some(cita => {
                const citaInicio = new Date(`${format(cita.fecha, 'yyyy-MM-dd')}T${cita.horaInicio}`)
                const citaFin = new Date(`${format(cita.fecha, 'yyyy-MM-dd')}T${cita.horaFin}`)

                // Ajuste: comparamos timestamps para precisión
                return (
                    (citaInicio < slotEnd && citaFin > currentSlot)
                )
            })

            // Verificar si es tiempo pasado (para el día de hoy)
            const isPast = isBefore(currentSlot, now)

            if (!isOccupied && !isPast) {
                slots.push({
                    hora: slotTimeStr,
                    disponible: true
                })
            }

            currentSlot = slotEnd
        }

        return NextResponse.json(slots)
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
