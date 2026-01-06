'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Odontograma from '@/components/odontograma/Odontograma'

interface Paciente {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

export default function NuevoExpedientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [odontogramaData, setOdontogramaData] = useState({})
  const [formData, setFormData] = useState({
    pacienteId: '',
    diagnostico: '',
    tratamiento: '',
    evolucion: '',
    proximaCita: '',
  })

  useEffect(() => {
    fetchPacientes()
  }, [])

  const fetchPacientes = async () => {
    try {
      const response = await fetch('/api/pacientes?limit=1000')
      const data = await response.json()
      if (response.ok) {
        setPacientes(data.pacientes)
      }
    } catch (error) {
      console.error('Error al cargar pacientes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          odontograma: JSON.stringify(odontogramaData),
        }),
      })

      if (response.ok) {
        toast.success('Expediente creado exitosamente')
        router.push('/dashboard/expedientes')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al crear expediente')
      }
    } catch (error) {
      toast.error('Error al crear expediente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/expedientes"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Expediente Clínico</h1>
          <p className="text-gray-600 mt-1">Registra un nuevo expediente odontológico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Paciente */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Seleccionar Paciente</h2>
          <div>
            <label className="label">Paciente *</label>
            <select
              required
              className="input-field"
              value={formData.pacienteId}
              onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
            >
              <option value="">Seleccione un paciente</option>
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.nombre} {paciente.apellido} - {paciente.identificacion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Odontograma */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Odontograma</h2>
          <Odontograma
            data={odontogramaData}
            editable={true}
            onChange={setOdontogramaData}
          />
        </div>

        {/* Diagnóstico y Tratamiento */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Diagnóstico y Tratamiento</h2>
          <div className="space-y-6">
            <div>
              <label className="label">Diagnóstico *</label>
              <textarea
                required
                rows={4}
                className="input-field"
                placeholder="Describa el diagnóstico del paciente..."
                value={formData.diagnostico}
                onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Tratamiento *</label>
              <textarea
                required
                rows={4}
                className="input-field"
                placeholder="Describa el tratamiento propuesto..."
                value={formData.tratamiento}
                onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Evolución</label>
              <textarea
                rows={4}
                className="input-field"
                placeholder="Notas sobre la evolución del tratamiento..."
                value={formData.evolucion}
                onChange={(e) => setFormData({ ...formData, evolucion: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Próxima Cita</label>
              <input
                type="date"
                className="input-field"
                value={formData.proximaCita}
                onChange={(e) => setFormData({ ...formData, proximaCita: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/expedientes" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar Expediente</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

