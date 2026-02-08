'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Loader2, X, User, Clock, FileText } from 'lucide-react'
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
  const [selectedEvent, setSelectedEvent] = useState<CitaEvent | null>(null)

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
    setSelectedEvent(event)
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      PROGRAMADA: 'Programada',
      CONFIRMADA: 'Confirmada',
      EN_CURSO: 'En Curso',
      COMPLETADA: 'Completada',
      CANCELADA: 'Cancelada',
      NO_ASISTIO: 'No Asistió',
    }
    return labels[estado] || estado
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PROGRAMADA: 'bg-blue-100 text-blue-800',
      CONFIRMADA: 'bg-indigo-100 text-indigo-800',
      EN_CURSO: 'bg-yellow-100 text-yellow-800',
      COMPLETADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
      NO_ASISTIO: 'bg-gray-100 text-gray-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda Médica</h1>
          <p className="text-muted-foreground text-sm">Organización de citas y pacientes</p>
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
      <div className="card flex-1 p-0 overflow-hidden shadow-sm border border-border">
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

      {/* Modal Detalle de Cita */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-foreground">Detalle de Cita</h2>
              <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium text-foreground">
                    {selectedEvent.resource.paciente.nombre} {selectedEvent.resource.paciente.apellido}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Odontólogo</p>
                  <p className="font-medium text-foreground">
                    {selectedEvent.resource.odontologo?.nombre} {selectedEvent.resource.odontologo?.apellido}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Horario</p>
                  <p className="font-medium text-foreground">
                    {format(selectedEvent.start, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.resource.horaInicio} - {selectedEvent.resource.horaFin}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo / Motivo</p>
                  <p className="font-medium text-foreground">{selectedEvent.resource.tipoCita}</p>
                  {selectedEvent.resource.motivo && (
                    <p className="text-sm text-muted-foreground">{selectedEvent.resource.motivo}</p>
                  )}
                </div>
              </div>
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(selectedEvent.resource.estado)}`}>
                  {getEstadoLabel(selectedEvent.resource.estado)}
                </span>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => setSelectedEvent(null)} className="btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
