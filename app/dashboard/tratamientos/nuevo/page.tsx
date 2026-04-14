'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Paciente {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

interface Etapa {
  nombre: string
  descripcion: string
  costo: string
}

export default function NuevoTratamientoPage() {
  const router = useRouter()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(false)
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [formData, setFormData] = useState({
    pacienteId: '',
    nombre: '',
    descripcion: '',
    estado: 'PLANIFICADO',
    costoTotal: '',
    observaciones: '',
  })
  const [nuevaEtapa, setNuevaEtapa] = useState({
    nombre: '',
    descripcion: '',
    costo: '',
  })

  useEffect(() => {
    fetchPacientes()
  }, [])

  const fetchPacientes = async () => {
    try {
      const response = await fetch('/api/pacientes')
      if (!response.ok) throw new Error('Error al cargar')
      const data = await response.json()
      setPacientes(data.pacientes || data)
    } catch (error) {
      toast.error('Error al cargar pacientes')
    }
  }

  const handleAgregarEtapa = () => {
    if (!nuevaEtapa.nombre || !nuevaEtapa.costo) {
      toast.error('Completa nombre y costo de la etapa')
      return
    }
    setEtapas([...etapas, nuevaEtapa])
    setNuevaEtapa({ nombre: '', descripcion: '', costo: '' })
    toast.success('Etapa agregada')
  }

  const handleEliminarEtapa = (index: number) => {
    setEtapas(etapas.filter((_, i) => i !== index))
    toast.success('Etapa eliminada')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pacienteId || !formData.nombre || !formData.costoTotal) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    try {
      setLoading(true)

      // Crear tratamiento
      const tratamientoResponse = await fetch('/api/tratamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: formData.pacienteId,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          estado: formData.estado,
          costoTotal: parseFloat(formData.costoTotal),
          observaciones: formData.observaciones,
        }),
      })

      if (!tratamientoResponse.ok) throw new Error('Error al crear tratamiento')
      const tratamiento = await tratamientoResponse.json()

      // Crear etapas
      for (let i = 0; i < etapas.length; i++) {
        const etapa = etapas[i]
        await fetch(`/api/tratamientos/${tratamiento.id}/etapas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: etapa.nombre,
            descripcion: etapa.descripcion,
            costo: parseFloat(etapa.costo),
            orden: i + 1,
          }),
        })
      }

      toast.success('Tratamiento creado exitosamente')
      router.push(`/dashboard/tratamientos/${tratamiento.id}`)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear tratamiento')
    } finally {
      setLoading(false)
    }
  }

  const costoTotalEtapas = etapas.reduce((sum, e) => sum + parseFloat(e.costo || '0'), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/tratamientos"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Tratamiento</h1>
          <p className="text-gray-600 mt-1">Crea un nuevo plan de tratamiento para un paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información del Tratamiento</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.pacienteId}
                onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} ({p.identificacion})
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Tratamiento <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Ortodoncia, Implante, etc."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
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
            </div>

            {/* Costo Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Total <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={formData.costoTotal}
                onChange={(e) => setFormData({ ...formData, costoTotal: e.target.value })}
                placeholder="0.00"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe el tratamiento..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Etapas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Etapas del Tratamiento</h2>

          {/* Formulario Nueva Etapa */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4">Agregar Etapa</h3>
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
            <button
              type="button"
              onClick={handleAgregarEtapa}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Etapa
            </button>
          </div>

          {/* Lista de Etapas */}
          {etapas.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No hay etapas agregadas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {etapas.map((etapa, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-300 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Etapa {index + 1}: {etapa.nombre}</h4>
                    <p className="text-sm text-gray-600">{etapa.descripcion}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">Costo: L. {parseFloat(etapa.costo || '0').toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarEtapa(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Resumen de Costos */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Costo Total de Etapas:</span>
              <span className="text-lg font-bold text-blue-600">L. {costoTotalEtapas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold text-gray-900">Costo Total del Tratamiento:</span>
              <span className="text-lg font-bold text-gray-900">L. {parseFloat(formData.costoTotal || '0').toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Creando...' : 'Crear Tratamiento'}
          </button>
          <Link
            href="/dashboard/tratamientos"
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
