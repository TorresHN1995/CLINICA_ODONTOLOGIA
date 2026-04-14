'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Trash2, Plus, CheckCircle, Clock, AlertCircle, DollarSign, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Etapa {
  id: string
  nombre: string
  descripcion: string
  orden: number
  completada: boolean
  costo: number
  fechaInicio: Date | null
  fechaFin: Date | null
}

interface Tratamiento {
  id: string
  nombre: string
  descripcion: string
  estado: string
  fechaInicio: Date | null
  costoTotal: number
  observaciones: string | null
  paciente: {
    id: string
    nombre: string
    apellido: string
    identificacion: string
  }
  etapas: Etapa[]
  createdAt: Date
  updatedAt: Date
}

export default function DetalleTratamientoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [tratamiento, setTratamiento] = useState<Tratamiento | null>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showNuevaEtapa, setShowNuevaEtapa] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: '',
    observaciones: '',
  })
  const [nuevaEtapa, setNuevaEtapa] = useState({
    nombre: '',
    descripcion: '',
    costo: '',
  })

  useEffect(() => {
    fetchTratamiento()
  }, [id])

  const fetchTratamiento = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tratamientos/${id}`)
      if (!response.ok) throw new Error('Error al cargar')
      const data = await response.json()
      setTratamiento(data)
      setFormData({
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: data.estado,
        observaciones: data.observaciones || '',
      })
    } catch (error) {
      toast.error('Error al cargar tratamiento')
      router.push('/dashboard/tratamientos')
    } finally {
      setLoading(false)
    }
  }

  const handleActualizar = async () => {
    try {
      const response = await fetch(`/api/tratamientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Error al actualizar')
      toast.success('Tratamiento actualizado')
      setEditando(false)
      fetchTratamiento()
    } catch (error) {
      toast.error('Error al actualizar tratamiento')
    }
  }

  const handleEliminar = async () => {
    try {
      const response = await fetch(`/api/tratamientos/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Error al eliminar')
      toast.success('Tratamiento eliminado')
      router.push('/dashboard/tratamientos')
    } catch (error) {
      toast.error('Error al eliminar tratamiento')
    }
  }

  const handleAgregarEtapa = async () => {
    if (!nuevaEtapa.nombre || !nuevaEtapa.costo) {
      toast.error('Completa todos los campos')
      return
    }

    try {
      const response = await fetch(`/api/tratamientos/${id}/etapas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevaEtapa.nombre,
          descripcion: nuevaEtapa.descripcion,
          costo: parseFloat(nuevaEtapa.costo),
          orden: (tratamiento?.etapas.length || 0) + 1,
        }),
      })
      if (!response.ok) throw new Error('Error al agregar')
      toast.success('Etapa agregada')
      setNuevaEtapa({ nombre: '', descripcion: '', costo: '' })
      setShowNuevaEtapa(false)
      fetchTratamiento()
    } catch (error) {
      toast.error('Error al agregar etapa')
    }
  }

  const handleCompletarEtapa = async (etapaId: string) => {
    try {
      const response = await fetch(`/api/tratamientos/${id}/etapas/${etapaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: true, fechaFin: new Date() }),
      })
      if (!response.ok) throw new Error('Error al completar')
      toast.success('Etapa completada')
      fetchTratamiento()
    } catch (error) {
      toast.error('Error al completar etapa')
    }
  }

  const handleEliminarEtapa = async (etapaId: string) => {
    try {
      const response = await fetch(`/api/tratamientos/${id}/etapas/${etapaId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Error al eliminar')
      toast.success('Etapa eliminada')
      fetchTratamiento()
    } catch (error) {
      toast.error('Error al eliminar etapa')
    }
  }

  const calcularProgreso = () => {
    if (!tratamiento || tratamiento.etapas.length === 0) return 0
    const completadas = tratamiento.etapas.filter(e => e.completada).length
    return Math.round((completadas / tratamiento.etapas.length) * 100)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800'
      case 'EN_PROGRESO':
        return 'bg-blue-100 text-blue-800'
      case 'PAUSADO':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!tratamiento) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tratamiento no encontrado</p>
      </div>
    )
  }

  const progreso = calcularProgreso()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/tratamientos"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tratamiento.nombre}</h1>
            <p className="text-gray-600 mt-1">
              {tratamiento.paciente.nombre} {tratamiento.paciente.apellido}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditando(!editando)}
            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            {editando ? (
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 font-medium">{tratamiento.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            {editando ? (
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PLANIFICADO">Planificado</option>
                <option value="EN_PROGRESO">En Progreso</option>
                <option value="PAUSADO">Pausado</option>
                <option value="COMPLETADO">Completado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            ) : (
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(tratamiento.estado)}`}>
                {tratamiento.estado.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            {editando ? (
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-700">{tratamiento.descripcion}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
            {editando ? (
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-700">{tratamiento.observaciones || 'Sin observaciones'}</p>
            )}
          </div>
        </div>

        {editando && (
          <div className="flex gap-2">
            <button
              onClick={handleActualizar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar Cambios
            </button>
            <button
              onClick={() => setEditando(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Costo Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">L. {tratamiento.costoTotal.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Progreso</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{progreso}%</p>
            </div>
            <Clock className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Etapas</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {tratamiento.etapas.filter(e => e.completada).length}/{tratamiento.etapas.length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Progreso General</h3>
          <span className="text-2xl font-bold text-blue-600">{progreso}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Etapas */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Etapas del Tratamiento</h3>
          <button
            onClick={() => setShowNuevaEtapa(!showNuevaEtapa)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Etapa
          </button>
        </div>

        {/* Formulario Nueva Etapa */}
        {showNuevaEtapa && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={nuevaEtapa.nombre}
                  onChange={(e) => setNuevaEtapa({ ...nuevaEtapa, nombre: e.target.value })}
                  placeholder="Nombre de la etapa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Costo</label>
                <input
                  type="number"
                  value={nuevaEtapa.costo}
                  onChange={(e) => setNuevaEtapa({ ...nuevaEtapa, costo: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={nuevaEtapa.descripcion}
                  onChange={(e) => setNuevaEtapa({ ...nuevaEtapa, descripcion: e.target.value })}
                  placeholder="Descripción"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAgregarEtapa}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Etapa
              </button>
              <button
                onClick={() => setShowNuevaEtapa(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Etapas */}
        {tratamiento.etapas.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay etapas definidas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tratamiento.etapas.map((etapa, index) => (
              <div
                key={etapa.id}
                className={`p-4 border-2 rounded-lg transition-all ${
                  etapa.completada
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                        Etapa {index + 1}
                      </span>
                      <h4 className="text-lg font-bold text-gray-900">{etapa.nombre}</h4>
                      {etapa.completada && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-gray-700 mt-2">{etapa.descripcion}</p>
                    <div className="flex gap-6 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>L. {etapa.costo.toFixed(2)}</span>
                      </div>
                      {etapa.fechaInicio && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(etapa.fechaInicio), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!etapa.completada && (
                      <button
                        onClick={() => handleCompletarEtapa(etapa.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Completar
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminarEtapa(etapa.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">¿Eliminar Tratamiento?</h3>
            <p className="text-gray-600 mb-6">
              Esta acción no se puede deshacer. Se eliminará el tratamiento y todas sus etapas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
