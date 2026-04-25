'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Loader2, X, User, Clock, FileText, PlayCircle, CheckCircle2, XCircle, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'

const locales = { 'es': es }

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

interface CitaEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: any
}

export default function AppointmentDashboard() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CitaEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CitaEvent | null>(null)

  const fetchCitas = useCallback(async (currentDate: Date, currentView: View) => {
    setLoading(true)
    try {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const params = new URLSearchParams({
        fechaInicio: format(start, 'yyyy-MM-dd'),
        fechaFin: format(end, 'yyyy-MM-dd')
      })
      const res = await fetch(`/api/citas?${params}`)
      if (res.ok) {
        const data = await res.json()
        const mappedEvents: CitaEvent[] = data.map((cita: any) => {
          const startDate = new Date(cita.fecha)
          const [startHour, startMin] = cita.horaInicio.split(':').map(Number)
          const [endHour, endMin] = cita.horaFin.split(':').map(Number)
          const startDateTime = new Date(startDate)
          startDateTime.setHours(startHour, startMin)
          const endDateTime = new Date(startDate)
          endDateTime.setHours(endHour, endMin)
          return { id: cita.id, title: `${cita.paciente.nombre} ${cita.paciente.apellido} - ${cita.tipoCita}`, start: startDateTime, end: endDateTime, resource: cita }
        })
        setEvents(mappedEvents)
      }
    } catch (error) {
      toast.error('Error al cargar agenda')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCitas(date, view) }, [date, view, fetchCitas])

  const eventStyleGetter = (event: CitaEvent) => {
    const estado = event.resource.estado
    let backgroundColor = '#3b82f6'
    if (estado === 'COMPLETADA') backgroundColor = '#22c55e'
    if (estado === 'CANCELADA') backgroundColor = '#ef4444'
    if (estado === 'EN_CURSO') backgroundColor = '#f59e0b'
    if (estado === 'CONFIRMADA') backgroundColor = '#6366f1'
    return { style: { backgroundColor, borderRadius: '6px', opacity: 0.9, color: 'white', border: '0px', display: 'block', fontSize: '0.85rem' } }
  }

  const handleSelectEvent = (event: CitaEvent) => setSelectedEvent(event)

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = { PROGRAMADA: 'Programada', CONFIRMADA: 'Confirmada', EN_CURSO: 'En Curso', COMPLETADA: 'Completada', CANCELADA: 'Cancelada', NO_ASISTIO: 'No Asistió' }
    return labels[estado] || estado
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = { PROGRAMADA: 'bg-blue-100 text-blue-800', CONFIRMADA: 'bg-indigo-100 text-indigo-800', EN_CURSO: 'bg-yellow-100 text-yellow-800', COMPLETADA: 'bg-green-100 text-green-800', CANCELADA: 'bg-red-100 text-red-800', NO_ASISTIO: 'bg-gray-100 text-gray-800' }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  // Verificar si el usuario actual es el odontólogo de la cita o es admin
  const esPropietarioCita = (cita: any) => {
    if (!session) return false
    if (session.user.role === 'ADMINISTRADOR') return true
    return session.user.id === cita.odontologoId
  }

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!selectedEvent) return
    setUpdatingEstado(true)
    try {
      const res = await fetch(`/api/citas/${selectedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        const updated = await res.json()
        toast.success(`Cita marcada como ${getEstadoLabel(nuevoEstado)}`)
        // Actualizar el evento seleccionado y la lista
        setSelectedEvent(prev => prev ? { ...prev, resource: { ...prev.resource, estado: nuevoEstado } } : null)
        await fetchCitas(date, view)
      } else {
        toast.error('Error al actualizar la cita')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setUpdatingEstado(false)
    }
  }

  const cita = selectedEvent?.resource
  const estado = cita?.estado
  const esPropietario = cita ? esPropietarioCita(cita) : false

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
          <Link href="/dashboard/citas/nueva" className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Cita</span>
          </Link>
        </div>
      </div>

      {/* Calendar */}
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
          messages={{ next: "Siguiente", previous: "Anterior", today: "Hoy", month: "Mes", week: "Semana", day: "Día", agenda: "Agenda", date: "Fecha", time: "Hora", event: "Evento", noEventsInRange: "No hay citas en este rango." }}
          culture='es'
          className="p-4"
        />
      </div>

      {/* Modal Detalle de Cita */}
      {selectedEvent && cita && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            {/* Header del modal con color según estado */}
            <div className={`flex items-center justify-between p-5 rounded-t-xl ${
              estado === 'EN_CURSO' ? 'bg-yellow-500' :
              estado === 'COMPLETADA' ? 'bg-green-500' :
              estado === 'CANCELADA' ? 'bg-red-500' :
              estado === 'CONFIRMADA' ? 'bg-indigo-500' :
              'bg-primary-600'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Detalle de Cita</h2>
                  <span className="text-xs text-white/80">{getEstadoLabel(estado)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="p-5 space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Paciente</p>
                  <p className="font-semibold text-foreground">{cita.paciente.nombre} {cita.paciente.apellido}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Stethoscope className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Odontólogo</p>
                  <p className="font-semibold text-foreground">Dr. {cita.odontologo?.nombre} {cita.odontologo?.apellido}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Horario</p>
                  <p className="font-semibold text-foreground">{format(selectedEvent.start, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
                  <p className="text-sm text-muted-foreground">{cita.horaInicio} – {cita.horaFin}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Tipo / Motivo</p>
                  <p className="font-semibold text-foreground">{cita.tipoCita}</p>
                  {cita.motivo && <p className="text-sm text-muted-foreground">{cita.motivo}</p>}
                </div>
              </div>

              {/* Acciones — solo visibles para el odontólogo dueño o admin */}
              {esPropietario && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Acciones</p>
                  <div className="flex flex-wrap gap-2">

                    {/* Iniciar cita */}
                    {(estado === 'PROGRAMADA' || estado === 'CONFIRMADA') && (
                      <button
                        onClick={() => cambiarEstado('EN_CURSO')}
                        disabled={updatingEstado}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {updatingEstado ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                        Iniciar Cita
                      </button>
                    )}

                    {/* Completar cita */}
                    {estado === 'EN_CURSO' && (
                      <button
                        onClick={() => cambiarEstado('COMPLETADA')}
                        disabled={updatingEstado}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {updatingEstado ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Completar
                      </button>
                    )}

                    {/* Cancelar cita */}
                    {(estado === 'PROGRAMADA' || estado === 'CONFIRMADA' || estado === 'EN_CURSO') && (
                      <button
                        onClick={() => cambiarEstado('CANCELADA')}
                        disabled={updatingEstado}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {updatingEstado ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Cancelar
                      </button>
                    )}

                    {/* No asistió */}
                    {(estado === 'PROGRAMADA' || estado === 'CONFIRMADA') && (
                      <button
                        onClick={() => cambiarEstado('NO_ASISTIO')}
                        disabled={updatingEstado}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {updatingEstado ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        No Asistió
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Mensaje si no es el odontólogo */}
              {!esPropietario && estado !== 'COMPLETADA' && estado !== 'CANCELADA' && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">Solo el odontólogo asignado puede cambiar el estado de esta cita.</p>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex justify-end">
              <button onClick={() => setSelectedEvent(null)} className="btn-secondary text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
