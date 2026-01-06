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
          <Link href="/dashboard/tratamientos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Tratamiento no encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/tratamientos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tratamiento.nombre}</h1>
            <p className="text-gray-600 mt-1">
              {tratamiento.paciente.nombre} {tratamiento.paciente.apellido} · {tratamiento.paciente.identificacion}
            </p>
          </div>
        </div>
        <div className="w-40">
          <div className="text-xs text-gray-600">Progreso</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }}></div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Inicio</p>
          <p className="text-lg font-semibold text-gray-900">
            {tratamiento.fechaInicio ? format(new Date(tratamiento.fechaInicio), 'dd/MM/yyyy', { locale: es }) : 'No iniciado'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Costo Total</p>
          <p className="text-lg font-semibold text-gray-900">{formatearMoneda(tratamiento.costoTotal)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Etapas</p>
          <p className="text-lg font-semibold text-gray-900">{tratamiento.etapas.length}</p>
        </div>
      </div>

      {/* Descripción */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-2">
          <Heart className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900">Descripción</h2>
        </div>
        <p className="text-gray-700">{tratamiento.descripcion}</p>
      </div>

      {/* Etapas */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Etapas</h2>
        {tratamiento.etapas.length === 0 ? (
          <p className="text-gray-600">Sin etapas.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 md:mx-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tratamiento.etapas.map((etapa) => (
                  <tr key={etapa.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">{etapa.orden}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 font-medium">{etapa.nombre}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">{etapa.descripcion || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 font-semibold">{formatearMoneda(etapa.costo)}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${etapa.completada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {etapa.completada ? 'Completada' : 'Pendiente'}
                      </span>
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


