'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'

interface Paciente {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

interface EtapaForm {
  id: string
  nombre: string
  descripcion: string
  costo: number
}

export default function NuevoTratamientoPage() {
  const { formatearMoneda } = useConfiguracion()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacienteId, setPacienteId] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [etapas, setEtapas] = useState<EtapaForm[]>([
    { id: '1', nombre: '', descripcion: '', costo: 0 },
  ])

  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        const response = await fetch('/api/pacientes?limit=1000')
        const data = await response.json()
        if (response.ok) {
          setPacientes(data.pacientes)
        }
      } catch (e) {
        console.error(e)
      }
    }
    cargarPacientes()
  }, [])

  const agregarEtapa = () => {
    setEtapas([...etapas, { id: Date.now().toString(), nombre: '', descripcion: '', costo: 0 }])
  }

  const eliminarEtapa = (id: string) => {
    if (etapas.length === 1) return
    setEtapas(etapas.filter(e => e.id !== id))
  }

  const actualizarEtapa = (id: string, field: keyof EtapaForm, value: any) => {
    setEtapas(etapas.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const costoTotal = etapas.reduce((sum, e) => sum + (Number(e.costo) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/tratamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId,
          nombre,
          descripcion,
          fechaInicio: fechaInicio || undefined,
          observaciones: observaciones || undefined,
          etapas: etapas.map(({ id, ...rest }) => rest),
        }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Tratamiento creado')
        router.push('/dashboard/tratamientos')
      } else {
        toast.error(data.error || 'Error al crear tratamiento')
      }
    } catch (error) {
      toast.error('Error al crear tratamiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/tratamientos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Tratamiento</h1>
          <p className="text-gray-600 mt-1">Crea un plan de tratamiento para el paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Paciente y datos principales */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información del Tratamiento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Paciente *</label>
              <select
                required
                className="input-field"
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
              >
                <option value="">Seleccione un paciente</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido} - {p.identificacion}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fecha de inicio</label>
              <input type="date" className="input-field" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Nombre *</label>
              <input type="text" required className="input-field" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Descripción *</label>
              <textarea className="input-field" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Etapas */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Etapas</h2>
            <button type="button" onClick={agregarEtapa} className="btn-secondary inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Agregar etapa</span>
            </button>
          </div>
          <div className="space-y-4">
            {etapas.map((etapa) => (
              <div key={etapa.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3">
                  <label className="label">Nombre *</label>
                  <input type="text" required className="input-field" value={etapa.nombre} onChange={(e) => actualizarEtapa(etapa.id, 'nombre', e.target.value)} />
                </div>
                <div className="md:col-span-7">
                  <label className="label">Descripción</label>
                  <input type="text" className="input-field" value={etapa.descripcion} onChange={(e) => actualizarEtapa(etapa.id, 'descripcion', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Costo *</label>
                  <input type="number" min="0" step="0.01" required className="input-field" value={etapa.costo} onChange={(e) => actualizarEtapa(etapa.id, 'costo', parseFloat(e.target.value) || 0)} />
                </div>
                {etapas.length > 1 && (
                  <div className="md:col-span-12 flex justify-end">
                    <button type="button" onClick={() => eliminarEtapa(etapa.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-end space-x-4">
            <div className="text-sm text-gray-700">Costo total</div>
            <div className="text-2xl font-bold text-primary-600">{formatearMoneda(costoTotal)}</div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/tratamientos" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center space-x-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Crear Tratamiento</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


