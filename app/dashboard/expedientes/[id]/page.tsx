'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2, FileText, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
          <Link href="/dashboard/expedientes" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Expediente no encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/expedientes" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expediente</h1>
          <p className="text-gray-600 mt-1">
            {expediente.paciente.nombre} {expediente.paciente.apellido} · {expediente.paciente.identificacion}
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Fecha de apertura</p>
          <p className="text-lg font-semibold text-gray-900">
            {format(new Date(expediente.fecha), "dd/MM/yyyy", { locale: es })}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Procedimientos</p>
          <p className="text-lg font-semibold text-gray-900">{expediente.procedimientos.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Próxima cita</p>
          <p className="text-lg font-semibold text-gray-900">
            {expediente.proximaCita
              ? format(new Date(expediente.proximaCita), "dd/MM/yyyy", { locale: es })
              : 'No programada'}
          </p>
        </div>
      </div>

      {/* Formulario de evolución */}
      <form onSubmit={guardar} className="card space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Próxima Cita</label>
            <input
              type="date"
              className="input-field"
              value={proximaCita}
              onChange={(e) => setProximaCita(e.target.value)}
            />
          </div>
          <div></div>
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

      {/* Procedimientos */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Procedimientos</h2>
        {expediente.procedimientos.length === 0 ? (
          <p className="text-gray-600">Sin procedimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 md:mx-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedimiento</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diente</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesional</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expediente.procedimientos.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                      {format(new Date(proc.fecha), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 font-medium">{proc.nombre}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">{proc.diente || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                      Dr. {proc.odontologo.nombre} {proc.odontologo.apellido}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 font-semibold">
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


