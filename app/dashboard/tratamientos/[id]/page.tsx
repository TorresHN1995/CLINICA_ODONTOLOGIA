'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Heart, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'

interface Params { params: { id: string } }

interface PacienteInfo {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

interface Etapa {
  id: string
  orden: number
  nombre: string
  descripcion: string | null
  costo: number
  completada: boolean
  fechaCompletada: string | null
}

interface TratamientoDetalle {
  id: string
  nombre: string
  descripcion: string
  estado: string
  fechaInicio: string | null
  fechaFin: string | null
  costoTotal: number
  observaciones: string | null
  paciente: PacienteInfo
  etapas: Etapa[]
}

export default function TratamientoDetallePage({ params }: Params) {
  const { formatearMoneda } = useConfiguracion()
  const router = useRouter()
  const [tratamiento, setTratamiento] = useState<TratamientoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const cargar = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tratamientos/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setTratamiento(data)
      } else {
        toast.error(data.error || 'Error al cargar tratamiento')
      }
    } catch (error) {
      toast.error('Error al cargar tratamiento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const progreso = useMemo(() => {
    if (!tratamiento) return 0
    if (tratamiento.etapas.length === 0) return 0
    const completas = tratamiento.etapas.filter(e => e.completada).length
    return Math.round((completas / tratamiento.etapas.length) * 100)
  }, [tratamiento])

  const toggleEtapa = async (etapa: Etapa) => {
    if (!tratamiento) return
    try {
      setToggling(etapa.id)
      const response = await fetch(`/api/tratamientos/${params.id}/etapas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapas: [{ id: etapa.id, completada: !etapa.completada }],
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setTratamiento(data)
        toast.success(etapa.completada ? 'Etapa marcada como pendiente' : 'Etapa completada')
      } else {
        toast.error('Error al actualizar etapa')
      }
    } catch {
      toast.error('Error al actualizar etapa')
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tratamiento) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/tratamientos" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Tratamiento no encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/tratamientos" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{tratamiento.nombre}</h1>
            <p className="text-muted-foreground mt-1">
              {tratamiento.paciente.nombre} {tratamiento.paciente.apellido} · {tratamiento.paciente.identificacion}
            </p>
          </div>
        </div>
        <div className="w-40">
          <div className="text-xs text-muted-foreground">Progreso</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%`, backgroundColor: 'rgb(var(--accent))' }}></div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-muted-foreground">Inicio</p>
          <p className="text-lg font-semibold text-foreground">
            {tratamiento.fechaInicio ? format(new Date(tratamiento.fechaInicio), 'dd/MM/yyyy', { locale: es }) : 'No iniciado'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Costo Total</p>
          <p className="text-lg font-semibold text-foreground">{formatearMoneda(tratamiento.costoTotal)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Etapas</p>
          <p className="text-lg font-semibold text-foreground">{tratamiento.etapas.length}</p>
        </div>
      </div>

      {/* Descripción */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-2">
          <Heart className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-foreground">Descripción</h2>
        </div>
        <p className="text-muted-foreground">{tratamiento.descripcion}</p>
      </div>

      {/* Etapas */}
      <div className="card">
        <h2 className="text-lg font-bold text-foreground mb-4">Etapas</h2>
        {tratamiento.etapas.length === 0 ? (
          <p className="text-muted-foreground">Sin etapas.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 md:mx-0">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Orden</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Descripción</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Costo</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Estado</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {tratamiento.etapas.map((etapa) => (
                  <tr key={etapa.id} className="hover:bg-muted">
                    <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">{etapa.orden}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-foreground font-medium">{etapa.nombre}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-muted-foreground">{etapa.descripcion || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-foreground font-semibold">{formatearMoneda(etapa.costo)}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${etapa.completada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {etapa.completada ? 'Completada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-center">
                      <button
                        onClick={() => toggleEtapa(etapa)}
                        disabled={toggling === etapa.id}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          etapa.completada
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        {toggling === etapa.id ? '...' : etapa.completada ? 'Desmarcar' : 'Completar'}
                      </button>
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


