'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

// Setup Localizer for Spanish
const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CitaEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: any // Full cita object
}

export default function AppointmentDashboard() {
  const [events, setEvents] = useState<CitaEvent[]>([])
  const [loading, setLoading] = useState(false)

  // Calendar State
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())

  const fetchCitas = useCallback(async (currentDate: Date, currentView: View) => {
    setLoading(true)
    try {
      let start, end

      if (currentView === Views.MONTH) {
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
      } else {
        // For week/day, just fetch the whole month to be safe or refine logic
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
      }

      const params = new URLSearchParams({
        fechaInicio: format(start, 'yyyy-MM-dd'),
        fechaFin: format(end, 'yyyy-MM-dd')
      })

      const res = await fetch(`/api/citas?${params}`)
      if (res.ok) {
        const data = await res.json()

        // Transform API data to Calendar Events
        const mappedEvents: CitaEvent[] = data.map((cita: any) => {
          const startDate = new Date(cita.fecha)
          const [startHour, startMin] = cita.horaInicio.split(':').map(Number)
          const [endHour, endMin] = cita.horaFin.split(':').map(Number)

          // Set precise times
          const startDateTime = new Date(startDate)
          startDateTime.setHours(startHour, startMin)

          const endDateTime = new Date(startDate)
          endDateTime.setHours(endHour, endMin)

          return {
            id: cita.id,
            title: `${cita.paciente.nombre} ${cita.paciente.apellido} - ${cita.tipoCita}`,
            start: startDateTime,
            end: endDateTime,
            resource: cita
          }
        })

        setEvents(mappedEvents)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar agenda')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCitas(date, view)
  }, [date, view, fetchCitas])

  // Event Styling
  const eventStyleGetter = (event: CitaEvent) => {
    let backgroundColor = '#3b82f6' // Blue default (PROGRAMADA)
    const estado = event.resource.estado

    if (estado === 'COMPLETADA') backgroundColor = '#22c55e' // Green
    if (estado === 'CANCELADA') backgroundColor = '#ef4444' // Red
    if (estado === 'EN_CURSO') backgroundColor = '#eab308' // Yellow/Orange

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem'
      }
    }
  }

  const handleSelectEvent = (event: CitaEvent) => {
    // TODO: Open detailed modal
    toast(`${event.title} (${event.resource.estado})`)
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda Médica</h1>
          <p className="text-gray-500 text-sm">Organización de citas y pacientes</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-primary-600" />}
          <Link
            href="/dashboard/citas/nueva"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Cita</span>
          </Link>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="card flex-1 p-0 overflow-hidden shadow-sm border border-gray-200">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          date={date}
          onView={(v) => setView(v)}
          onNavigate={(d) => setDate(d)}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay citas en este rango."
          }}
          culture='es'
          className="p-4"
        />
      </div>
    </div>
  )
}
