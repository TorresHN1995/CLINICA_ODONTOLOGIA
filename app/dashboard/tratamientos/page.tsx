'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Heart, Calendar, DollarSign } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'

interface Tratamiento {
  id: string
  nombre: string
  descripcion: string
  estado: string
  fechaInicio: Date | null
  costoTotal: number
  observaciones: string | null
  paciente: {
    nombre: string
    apellido: string
    identificacion: string
  }
  etapas: any[]
  createdAt: Date
}

export default function TratamientosPage() {
  const { formatearMoneda } = useConfiguracion()
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')

  useEffect(() => {
    fetchTratamientos()
  }, [filtroEstado])

  const fetchTratamientos = async () => {
    try {
      setLoading(true)
      const url = filtroEstado
        ? `/api/tratamientos?estado=${filtroEstado}`
        : '/api/tratamientos'
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setTratamientos(data)
      } else {
        toast.error('Error al cargar tratamientos')
      }
    } catch (error) {
      toast.error('Error al cargar tratamientos')
    } finally {
      setLoading(false)
    }
  }

  const calcularProgreso = (tratamiento: Tratamiento) => {
    if (tratamiento.etapas.length === 0) return 0
    const completadas = tratamiento.etapas.filter(e => e.completada).length
    return Math.round((completadas / tratamiento.etapas.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Tratamientos</h1>
          <p className="text-muted-foreground mt-1">
            Administra los planes de tratamiento de los pacientes
          </p>
        </div>
        <Link
          href="/dashboard/tratamientos/nuevo"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Tratamiento</span>
        </Link>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="label">Filtrar por estado:</label>
          <select
            className="input-field w-64"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="PLANIFICADO">Planificados</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="PAUSADO">Pausados</option>
            <option value="COMPLETADO">Completados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Lista de Tratamientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : tratamientos.length === 0 ? (
          <div className="col-span-2 card text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron tratamientos</p>
          </div>
        ) : (
          tratamientos.map((tratamiento) => {
            const progreso = calcularProgreso(tratamiento)

            return (
              <div key={tratamiento.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {tratamiento.nombre}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tratamiento.paciente.nombre} {tratamiento.paciente.apellido}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${tratamiento.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                    tratamiento.estado === 'EN_PROGRESO' ? 'bg-blue-100 text-blue-800' :
                      tratamiento.estado === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' :
                        tratamiento.estado === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {tratamiento.estado.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {tratamiento.descripcion}
                </p>

                {/* Barra de progreso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Progreso</span>
                    <span className="text-sm font-bold text-primary-600">{progreso}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progreso}%`, backgroundColor: 'rgb(var(--accent))' }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <div>
                      <p className="text-xs text-muted-foreground">Inicio</p>
                      <p className="font-medium">
                        {tratamiento.fechaInicio
                          ? format(new Date(tratamiento.fechaInicio), "dd/MM/yyyy", { locale: es })
                          : 'No iniciado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <div>
                      <p className="text-xs text-muted-foreground">Costo Total</p>
                      <p className="font-medium">
                        {formatearMoneda(tratamiento.costoTotal)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Etapas:</span> {tratamiento.etapas.length} total,{' '}
                    {tratamiento.etapas.filter(e => e.completada).length} completadas
                  </p>
                  <Link
                    href={`/dashboard/tratamientos/${tratamiento.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

