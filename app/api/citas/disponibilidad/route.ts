import { NextRequest, NextResponse } from 'next/server'
import { parseFechaLocal } from '@/lib/fecha'
import { libresPorFranja } from '@/lib/asignacion-odontologo'
import { setHours, setMinutes, addMinutes, format, isBefore } from 'date-fns'

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

        const fecha = parseFechaLocal(fechaParam)
        if (isNaN(fecha.getTime())) {
            return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
        }

        // 1. Definir horario de trabajo (Ej: 8:00 AM - 5:00 PM)
        const startHour = 8
        const endHour = 17
        const slotDuration = 60 // 1 hora por cita default para la web pública

        // 2. Armar las franjas del día
        const franjas: { inicio: string; fin: string; momento: Date }[] = []
        let currentSlot = setMinutes(setHours(fecha, startHour), 0)
        const endTime = setMinutes(setHours(fecha, endHour), 0)

        while (isBefore(currentSlot, endTime)) {
            const slotEnd = addMinutes(currentSlot, slotDuration)
            franjas.push({
                inicio: format(currentSlot, 'HH:mm'),
                fin: format(slotEnd, 'HH:mm'),
                momento: currentSlot,
            })
            currentSlot = slotEnd
        }

        // 3. Una franja sigue disponible mientras quede AL MENOS UN profesional
        // libre. Antes se descartaba en cuanto existía cualquier cita a esa hora,
        // aunque los demás odontólogos estuvieran desocupados.
        const libres = await libresPorFranja(
            format(fecha, 'yyyy-MM-dd'),
            franjas.map(({ inicio, fin }) => ({ inicio, fin })),
            odontologoId
        )

        const ahora = new Date()
        const slots = franjas
            .filter((franja) => !isBefore(franja.momento, ahora))
            .filter((franja) => (libres.get(franja.inicio) || 0) > 0)
            .map((franja) => ({
                hora: franja.inicio,
                disponible: true,
                profesionalesLibres: libres.get(franja.inicio) || 0,
            }))

        return NextResponse.json(slots)
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
