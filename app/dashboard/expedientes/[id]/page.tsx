'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2, FileText, Calendar, CalendarPlus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseFechaLocal } from '@/lib/fecha'

interface Params { params: { id: string } }

interface PacienteInfo {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

interface ProcedimientoItem {
  id: string
  fecha: string
  nombre: string
  descripcion: string
  precio: number
  diente?: string | null
  odontologo: { nombre: string, apellido: string }
}

interface ImagenClinicaItem {
  id: string
  nombre: string
  url: string
  tipo: string
  tamanio: number
}

interface OdontologoInfo {
  id: string
  nombre: string
  apellido: string
}

interface ExpedienteDetalle {
  id: string
  fecha: string
  diagnostico: string
  tratamiento: string
  evolucion: string | null
  proximaCita: string | null
  odontograma: string | null
  paciente: PacienteInfo
  procedimientos: ProcedimientoItem[]
  imagenes: ImagenClinicaItem[]
}

export default function ExpedienteDetallePage({ params }: Params) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expediente, setExpediente] = useState<ExpedienteDetalle | null>(null)
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [evolucion, setEvolucion] = useState('')
  const [proximaCita, setProximaCita] = useState('')
  // Programar próxima cita en la agenda (crea una Cita real)
  const { data: session } = useSession()
  const [odontologos, setOdontologos] = useState<OdontologoInfo[]>([])
  const [citaOdontologoId, setCitaOdontologoId] = useState('')
  const [citaHora, setCitaHora] = useState('09:00')
  const [citaDuracion, setCitaDuracion] = useState(30)
  const [citaTipo, setCitaTipo] = useState('CONTROL')
  const [agendando, setAgendando] = useState(false)

  const cargar = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/expedientes/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setExpediente(data)
        setDiagnostico(data.diagnostico || '')
        setTratamiento(data.tratamiento || '')
        setEvolucion(data.evolucion || '')
        setProximaCita(data.proximaCita ? data.proximaCita.substring(0, 10) : '')
      } else {
        toast.error(data.error || 'Error al cargar expediente')
      }
    } catch (error) {
      toast.error('Error al cargar expediente')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Cargar odontólogos para el selector de "programar próxima cita"
  useEffect(() => {
    const cargarOdontologos = async () => {
      try {
        const res = await fetch('/api/usuarios?rol=ODONTOLOGO')
        const data = await res.json()
        if (res.ok) setOdontologos(data.usuarios || [])
      } catch {
        // silencioso: si falla, el selector queda vacío
      }
    }
    cargarOdontologos()
  }, [])

  // Preseleccionar odontólogo: el logueado si es ODONTOLOGO, si no el primero
  useEffect(() => {
    if (citaOdontologoId || odontologos.length === 0) return
    if (session?.user?.role === 'ODONTOLOGO' && odontologos.some((o) => o.id === session.user.id)) {
      setCitaOdontologoId(session.user.id)
    } else {
      setCitaOdontologoId(odontologos[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odontologos, session])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await fetch(`/api/expedientes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnostico,
          tratamiento,
          evolucion,
          proximaCita: proximaCita || null,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Expediente actualizado')
        setExpediente(data)
      } else {
        toast.error(data.error || 'Error al actualizar expediente')
      }
    } catch (error) {
      toast.error('Error al actualizar expediente')
    } finally {
      setSaving(false)
    }
  }

  // Suma minutos a una hora "HH:mm" y devuelve "HH:mm"
  const sumarMinutos = (hora: string, minutos: number) => {
    const [h, m] = hora.split(':').map(Number)
    const total = h * 60 + m + minutos
    const hh = Math.floor((total % (24 * 60)) / 60)
    const mm = total % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  const programarCitaAgenda = async () => {
    if (!expediente) return
    if (!proximaCita) { toast.error('Selecciona la fecha de la próxima cita'); return }
    if (!citaOdontologoId) { toast.error('Selecciona el odontólogo'); return }
    if (!citaHora) { toast.error('Selecciona la hora'); return }

    try {
      setAgendando(true)
      const horaFin = sumarMinutos(citaHora, citaDuracion)

      // 1) Crear la cita real en la agenda
      const resCita = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: expediente.paciente.id,
          odontologoId: citaOdontologoId,
          fecha: proximaCita,
          horaInicio: citaHora,
          horaFin,
          duracion: citaDuracion,
          tipoCita: citaTipo,
          motivo: `Próxima cita programada desde el expediente${expediente.diagnostico ? ': ' + expediente.diagnostico.slice(0, 200) : ''}`,
        }),
      })
      const dataCita = await resCita.json()
      if (!resCita.ok) {
        toast.error(dataCita.error || 'No se pudo agendar la cita')
        return
      }

      // 2) Guardar también el recordatorio de próxima cita en el expediente
      await fetch(`/api/expedientes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proximaCita }),
      }).catch(() => {})

      const odo = odontologos.find((o) => o.id === citaOdontologoId)
      toast.success(
        `Cita agendada el ${format(parseFechaLocal(proximaCita), "dd/MM/yyyy", { locale: es })} a las ${citaHora}` +
          (odo ? ` con Dr. ${odo.nombre} ${odo.apellido}` : '')
      )
      cargar()
    } catch (error) {
      toast.error('Error al agendar la cita')
    } finally {
      setAgendando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!expediente) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/expedientes" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Expediente no encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/expedientes" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expediente</h1>
          <p className="text-muted-foreground mt-1">
            {expediente.paciente.nombre} {expediente.paciente.apellido} · {expediente.paciente.identificacion}
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-muted-foreground">Fecha de apertura</p>
          <p className="text-lg font-semibold text-foreground">
            {format(new Date(expediente.fecha), "dd/MM/yyyy", { locale: es })}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Procedimientos</p>
          <p className="text-lg font-semibold text-foreground">{expediente.procedimientos.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Próxima cita</p>
          <p className="text-lg font-semibold text-foreground">
            {expediente.proximaCita
              ? format(parseFechaLocal(expediente.proximaCita), "dd/MM/yyyy", { locale: es })
              : 'No programada'}
          </p>
        </div>
      </div>

      {/* Formulario de evolución */}
      <form onSubmit={guardar} className="card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Evolución y Plan
        </h2>

        <div>
          <label className="label">Diagnóstico</label>
          <textarea
            className="input-field"
            rows={3}
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tratamiento</label>
          <textarea
            className="input-field"
            rows={3}
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Evolución</label>
          <textarea
            className="input-field"
            rows={3}
            value={evolucion}
            onChange={(e) => setEvolucion(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary inline-flex items-center space-x-2">
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Programar próxima cita en la agenda */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center">
          <CalendarPlus className="w-5 h-5 mr-2" />
          Programar próxima cita
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea una cita real en la agenda para {expediente.paciente.nombre} {expediente.paciente.apellido} y
          guarda la fecha como próxima cita del expediente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Fecha *</label>
            <input
              type="date"
              className="input-field"
              value={proximaCita}
              onChange={(e) => setProximaCita(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Odontólogo *</label>
            <select
              className="input-field"
              value={citaOdontologoId}
              onChange={(e) => setCitaOdontologoId(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {odontologos.map((o) => (
                <option key={o.id} value={o.id}>
                  Dr. {o.nombre} {o.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Hora *</label>
            <input
              type="time"
              className="input-field"
              value={citaHora}
              onChange={(e) => setCitaHora(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Duración</label>
            <select
              className="input-field"
              value={citaDuracion}
              onChange={(e) => setCitaDuracion(Number(e.target.value))}
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hora</option>
              <option value={90}>1 h 30 min</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              className="input-field"
              value={citaTipo}
              onChange={(e) => setCitaTipo(e.target.value)}
            >
              <option value="CONTROL">Control</option>
              <option value="CONSULTA">Consulta</option>
              <option value="LIMPIEZA">Limpieza</option>
              <option value="EXTRACCION">Extracción</option>
              <option value="ENDODONCIA">Endodoncia</option>
              <option value="ORTODONCIA">Ortodoncia</option>
              <option value="PROTESIS">Prótesis</option>
              <option value="CIRUGIA">Cirugía</option>
              <option value="EMERGENCIA">Emergencia</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={programarCitaAgenda}
            disabled={agendando}
            className="btn-primary inline-flex items-center space-x-2"
          >
            {agendando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Agendando…</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5" />
                <span>Programar en agenda</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Procedimientos */}
      <div className="card">
        <h2 className="text-lg font-bold text-foreground mb-4">Procedimientos</h2>
        {expediente.procedimientos.length === 0 ? (
          <p className="text-muted-foreground">Sin procedimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 md:mx-0">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Procedimiento</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Diente</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Profesional</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Costo</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {expediente.procedimientos.map((proc) => (
                  <tr key={proc.id} className="hover:bg-muted">
                    <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">
                      {format(parseFechaLocal(proc.fecha), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-foreground font-medium">{proc.nombre}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">{proc.diente || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">
                      Dr. {proc.odontologo.nombre} {proc.odontologo.apellido}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-foreground font-semibold">
                      ${Number(proc.precio).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}


