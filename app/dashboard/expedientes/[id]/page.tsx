'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  CalendarPlus,
  CalendarDays,
  Stethoscope,
  Plus,
  Trash2,
  Wand2,
  History,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseFechaLocal, hoyLocalISO } from '@/lib/fecha'
import Odontograma from '@/components/odontograma/Odontograma'
import {
  OdontogramaData,
  generarDiagnostico,
  parseOdontograma,
  piezasAfectadas,
} from '@/lib/odontograma'

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

interface NotaEvolucionItem {
  id: string
  fecha: string
  motivo: string | null
  hallazgos: string | null
  procedimiento: string | null
  indicaciones: string | null
  piezas: string | null
  proximaCita: string | null
  odontologo: OdontologoInfo
}

interface CitaItem {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  tipoCita: string
  estado: string
  motivo: string | null
  odontologo: OdontologoInfo
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
  notas: NotaEvolucionItem[]
  citas: CitaItem[]
}

const ESTADO_CITA_LABEL: Record<string, string> = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
}

const ESTADO_CITA_COLOR: Record<string, string> = {
  PROGRAMADA: 'bg-blue-500/15 text-blue-400',
  CONFIRMADA: 'bg-indigo-500/15 text-indigo-400',
  EN_CURSO: 'bg-amber-500/15 text-amber-400',
  COMPLETADA: 'bg-emerald-500/15 text-emerald-400',
  CANCELADA: 'bg-red-500/15 text-red-400',
  NO_ASISTIO: 'bg-slate-500/15 text-slate-400',
}

const notaVacia = {
  odontologoId: '',
  fecha: hoyLocalISO(),
  motivo: '',
  hallazgos: '',
  procedimiento: '',
  indicaciones: '',
  piezas: '',
  proximaCita: '',
}

export default function ExpedienteDetallePage({ params }: Params) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expediente, setExpediente] = useState<ExpedienteDetalle | null>(null)
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [evolucion, setEvolucion] = useState('')
  const [proximaCita, setProximaCita] = useState('')
  const [odontograma, setOdontograma] = useState<OdontogramaData>({})

  // Programar próxima cita en la agenda (crea una Cita real)
  const [odontologos, setOdontologos] = useState<OdontologoInfo[]>([])
  const [citaOdontologoId, setCitaOdontologoId] = useState('')
  const [citaHora, setCitaHora] = useState('09:00')
  const [citaDuracion, setCitaDuracion] = useState(30)
  const [citaTipo, setCitaTipo] = useState('CONTROL')
  const [agendando, setAgendando] = useState(false)

  // Nota de evolución (seguimiento de la sesión de hoy)
  const [nuevaNota, setNuevaNota] = useState({ ...notaVacia })
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [formNotaAbierto, setFormNotaAbierto] = useState(false)

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
        setOdontograma(parseOdontograma(data.odontograma))
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

  // Cargar odontólogos para el selector de "programar próxima cita" y las notas
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
    if (odontologos.length === 0) return
    const propio =
      session?.user?.role === 'ODONTOLOGO' && odontologos.some((o) => o.id === session.user.id)
        ? session.user.id
        : odontologos[0].id
    setCitaOdontologoId((prev) => prev || propio)
    setNuevaNota((prev) => (prev.odontologoId ? prev : { ...prev, odontologoId: propio }))
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
          odontograma: JSON.stringify(odontograma),
        }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Expediente actualizado')
        await cargar()
      } else {
        toast.error(data.error || 'Error al actualizar expediente')
      }
    } catch (error) {
      toast.error('Error al actualizar expediente')
    } finally {
      setSaving(false)
    }
  }

  const redactarDesdeOdontograma = () => {
    const texto = generarDiagnostico(odontograma)
    if (!texto) {
      toast('Marca primero el estado de alguna pieza en el odontograma', { icon: '🦷' })
      return
    }
    setDiagnostico(texto)
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
        `Cita agendada el ${format(parseFechaLocal(proximaCita), 'dd/MM/yyyy', { locale: es })} a las ${citaHora}` +
          (odo ? ` con Dr. ${odo.nombre} ${odo.apellido}` : '')
      )
      await cargar()
    } catch (error) {
      toast.error('Error al agendar la cita')
    } finally {
      setAgendando(false)
    }
  }

  const guardarNota = async () => {
    if (!nuevaNota.odontologoId) { toast.error('Selecciona el odontólogo que atiende'); return }
    try {
      setGuardandoNota(true)
      const res = await fetch(`/api/expedientes/${params.id}/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevaNota,
          proximaCita: nuevaNota.proximaCita || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'No se pudo guardar la nota')
        return
      }
      toast.success('Nota de evolución agregada')
      setNuevaNota({ ...notaVacia, odontologoId: nuevaNota.odontologoId })
      setFormNotaAbierto(false)
      await cargar()
    } catch {
      toast.error('Error al guardar la nota de evolución')
    } finally {
      setGuardandoNota(false)
    }
  }

  const eliminarNota = async (notaId: string) => {
    try {
      const res = await fetch(`/api/expedientes/${params.id}/notas/${notaId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'No se pudo eliminar la nota')
        return
      }
      toast.success('Nota eliminada')
      await cargar()
    } catch {
      toast.error('Error al eliminar la nota')
    }
  }

  const hallazgos = useMemo(() => piezasAfectadas(odontograma), [odontograma])

  const proximaCitaAgendada = useMemo(() => {
    if (!expediente) return null
    const hoy = hoyLocalISO()
    return (
      [...expediente.citas]
        .filter((c) => c.fecha.substring(0, 10) >= hoy && c.estado !== 'CANCELADA')
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))[0] || null
    )
  }, [expediente])

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

  const agendaFiltradaPorRol =
    session?.user?.role === 'ODONTOLOGO' && citaOdontologoId !== session.user.id

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-muted-foreground">Fecha de apertura</p>
          <p className="text-lg font-semibold text-foreground">
            {format(new Date(expediente.fecha), 'dd/MM/yyyy', { locale: es })}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Notas de evolución</p>
          <p className="text-lg font-semibold text-foreground">{expediente.notas.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Piezas con hallazgos</p>
          <p className="text-lg font-semibold text-foreground">{hallazgos.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Próxima cita en agenda</p>
          {proximaCitaAgendada ? (
            <Link
              href={`/dashboard/citas?fecha=${proximaCitaAgendada.fecha.substring(0, 10)}`}
              className="text-lg font-semibold text-primary-600 hover:underline"
            >
              {format(parseFechaLocal(proximaCitaAgendada.fecha), 'dd/MM/yyyy', { locale: es })} ·{' '}
              {proximaCitaAgendada.horaInicio}
            </Link>
          ) : (
            <p className="text-lg font-semibold text-foreground">No programada</p>
          )}
        </div>
      </div>

      {/* Odontograma */}
      <div className="card">
        <h2 className="text-lg font-bold text-foreground flex items-center mb-4">
          <Stethoscope className="w-5 h-5 mr-2" />
          Odontograma
        </h2>
        <Odontograma data={odontograma} editable onChange={setOdontograma} />
        <p className="mt-4 text-xs text-muted-foreground">
          Los cambios del odontograma se guardan con el botón «Guardar» de Evolución y Plan.
        </p>
      </div>

      {/* Formulario de evolución */}
      <form onSubmit={guardar} className="card space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Evolución y Plan
        </h2>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <label className="label mb-0">Diagnóstico</label>
            <button
              type="button"
              onClick={redactarDesdeOdontograma}
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
            >
              <Wand2 className="w-4 h-4" />
              Redactar desde el odontograma
            </button>
          </div>
          <textarea
            className="input-field"
            rows={6}
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
          <label className="label">Evolución (resumen general)</label>
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

      {/* Seguimiento: notas de evolución */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground flex items-center">
            <History className="w-5 h-5 mr-2" />
            Seguimiento clínico
          </h2>
          <button
            type="button"
            onClick={() => setFormNotaAbierto((v) => !v)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {formNotaAbierto ? 'Cerrar' : 'Nueva nota de evolución'}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Cada sesión se registra como una nota independiente, así el historial del caso queda
          completo en lugar de sobrescribirse.
        </p>

        {formNotaAbierto && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Fecha de la sesión</label>
                <input
                  type="date"
                  className="input-field"
                  value={nuevaNota.fecha}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, fecha: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Atendido por *</label>
                <select
                  className="input-field"
                  value={nuevaNota.odontologoId}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, odontologoId: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {odontologos.map((o) => (
                    <option key={o.id} value={o.id}>Dr. {o.nombre} {o.apellido}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Piezas tratadas</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={hallazgos.length ? hallazgos.map((h) => h.numero).join(', ') : 'Ej. 16, 26'}
                  value={nuevaNota.piezas}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, piezas: e.target.value })}
                />
                {hallazgos.length > 0 && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-primary-600 hover:underline"
                    onClick={() =>
                      setNuevaNota({ ...nuevaNota, piezas: hallazgos.map((h) => h.numero).join(', ') })
                    }
                  >
                    Usar las piezas con hallazgos del odontograma
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Motivo de consulta</label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="¿Por qué vino el paciente hoy?"
                  value={nuevaNota.motivo}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, motivo: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Hallazgos / evolución</label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Cómo respondió al tratamiento anterior, examen de hoy..."
                  value={nuevaNota.hallazgos}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, hallazgos: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Procedimiento realizado</label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Qué se hizo en esta sesión..."
                  value={nuevaNota.procedimiento}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, procedimiento: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Indicaciones al paciente</label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Medicación, cuidados en casa, controles..."
                  value={nuevaNota.indicaciones}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, indicaciones: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Próximo control</label>
                <input
                  type="date"
                  className="input-field"
                  value={nuevaNota.proximaCita}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, proximaCita: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={guardarNota}
                disabled={guardandoNota}
                className="btn-primary inline-flex items-center gap-2"
              >
                {guardandoNota ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar nota
              </button>
            </div>
          </div>
        )}

        {/* Línea de tiempo */}
        {expediente.notas.length === 0 ? (
          <p className="text-muted-foreground">
            Aún no hay notas de evolución. La primera nota abre el seguimiento del caso.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-6">
            {expediente.notas.map((nota) => {
              const puedeBorrar =
                session?.user?.role === 'ADMINISTRADOR' || session?.user?.id === nota.odontologo.id
              return (
                <li key={nota.id} className="relative">
                  <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-card bg-primary-600" />
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {format(parseFechaLocal(nota.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {nota.odontologo.nombre} {nota.odontologo.apellido}
                          {nota.piezas ? ` · Piezas ${nota.piezas}` : ''}
                        </p>
                      </div>
                      {puedeBorrar && (
                        <button
                          type="button"
                          onClick={() => eliminarNota(nota.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <dl className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {nota.motivo && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motivo</dt>
                          <dd className="whitespace-pre-wrap text-foreground">{nota.motivo}</dd>
                        </div>
                      )}
                      {nota.hallazgos && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hallazgos</dt>
                          <dd className="whitespace-pre-wrap text-foreground">{nota.hallazgos}</dd>
                        </div>
                      )}
                      {nota.procedimiento && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Procedimiento</dt>
                          <dd className="whitespace-pre-wrap text-foreground">{nota.procedimiento}</dd>
                        </div>
                      )}
                      {nota.indicaciones && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Indicaciones</dt>
                          <dd className="whitespace-pre-wrap text-foreground">{nota.indicaciones}</dd>
                        </div>
                      )}
                    </dl>

                    {nota.proximaCita && (
                      <p className="mt-3 text-xs text-amber-500">
                        Próximo control:{' '}
                        {format(parseFechaLocal(nota.proximaCita), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

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

        {agendaFiltradaPorRol && (
          <p className="text-sm text-amber-500">
            La estás agendando con otro odontólogo. Tu agenda solo muestra tus propias citas, así que
            esta no aparecerá en «Mi Agenda».
          </p>
        )}

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

      {/* Citas del paciente */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            Citas del paciente
          </h2>
          <Link href="/dashboard/citas" className="text-sm text-primary-600 hover:underline">
            Abrir la agenda
          </Link>
        </div>
        {expediente.citas.length === 0 ? (
          <p className="text-muted-foreground">Este paciente aún no tiene citas en la agenda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {expediente.citas.map((cita) => (
              <li key={cita.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link
                    href={`/dashboard/citas?fecha=${cita.fecha.substring(0, 10)}`}
                    className="font-medium text-foreground hover:text-primary-600"
                  >
                    {format(parseFechaLocal(cita.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {cita.horaInicio} – {cita.horaFin} · {cita.tipoCita} · Dr. {cita.odontologo.nombre}{' '}
                    {cita.odontologo.apellido}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ESTADO_CITA_COLOR[cita.estado] || 'bg-slate-500/15 text-slate-400'
                  }`}
                >
                  {ESTADO_CITA_LABEL[cita.estado] || cita.estado}
                </span>
              </li>
            ))}
          </ul>
        )}
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
