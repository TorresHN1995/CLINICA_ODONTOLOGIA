'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Combobox } from '@/components/ui/Combobox'

interface Paciente {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

interface Odontologo {
  id: string
  nombre: string
  apellido: string
}

const duracionesPorTipo: Record<string, number> = {
  CONSULTA: 30,
  LIMPIEZA: 60,
  EXTRACCION: 45,
  ENDODONCIA: 90,
  ORTODONCIA: 60,
  PROTESIS: 90,
  CIRUGIA: 120,
  CONTROL: 30,
  EMERGENCIA: 45,
  OTRO: 30,
}

export default function NuevaCitaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [formData, setFormData] = useState({
    pacienteId: '',
    odontologoId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    duracion: 30,
    tipoCita: 'CONSULTA',
    motivo: '',
    observaciones: '',
  })

  useEffect(() => {
    fetchPacientes()
    fetchOdontologos()
  }, [])

  useEffect(() => {
    // Calcular hora fin automáticamente
    if (formData.horaInicio && formData.duracion) {
      const [horas, minutos] = formData.horaInicio.split(':').map(Number)
      const minutosInicio = horas * 60 + minutos
      const minutosFin = minutosInicio + formData.duracion
      const horasFin = Math.floor(minutosFin / 60)
      const minutosFin2 = minutosFin % 60
      const horaFin = `${String(horasFin).padStart(2, '0')}:${String(minutosFin2).padStart(2, '0')}`
      setFormData(prev => ({ ...prev, horaFin }))
    }
  }, [formData.horaInicio, formData.duracion])

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

  const fetchOdontologos = async () => {
    try {
      const response = await fetch('/api/usuarios?rol=ODONTOLOGO')
      const data = await response.json()
      if (response.ok) {
        setOdontologos(data.usuarios || [])
      }
    } catch (error) {
      console.error('Error al cargar odontólogos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.pacienteId) {
      toast.error('Por favor seleccione un paciente')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Cita creada exitosamente')
        router.push('/dashboard/citas')
      } else {
        toast.error(data.error || 'Error al crear cita')
      }
    } catch (error) {
      toast.error('Error al crear cita')
    } finally {
      setLoading(false)
    }
  }

  const handleTipoCitaChange = (tipo: string) => {
    setFormData({
      ...formData,
      tipoCita: tipo,
      duracion: duracionesPorTipo[tipo] || 30,
    })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/citas"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Cita</h1>
          <p className="text-muted-foreground mt-1">Programa una nueva cita</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-foreground mb-6">Información de la Cita</h2>

          <div className="space-y-6">
            <div>
              <label className="label">Paciente *</label>
              <Combobox
                options={pacientes.map(p => ({
                  id: p.id,
                  label: `${p.nombre} ${p.apellido} - ${p.identificacion}`
                }))}
                value={formData.pacienteId}
                onChange={(value) => setFormData({ ...formData, pacienteId: value })}
                placeholder="Seleccione un paciente"
                searchPlaceholder="Buscar paciente..."
                emptyMessage="No se encontraron pacientes."
              />
            </div>

            <div>
              <label className="label">Odontólogo *</label>
              <select
                required
                className="input-field"
                value={formData.odontologoId}
                onChange={(e) => setFormData({ ...formData, odontologoId: e.target.value })}
              >
                <option value="">Seleccione un odontólogo</option>
                {odontologos.map((odontologo) => (
                  <option key={odontologo.id} value={odontologo.id}>
                    Dr. {odontologo.nombre} {odontologo.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo de Cita *</label>
              <select
                required
                className="input-field"
                value={formData.tipoCita}
                onChange={(e) => handleTipoCitaChange(e.target.value)}
              >
                <option value="CONSULTA">Consulta</option>
                <option value="LIMPIEZA">Limpieza</option>
                <option value="EXTRACCION">Extracción</option>
                <option value="ENDODONCIA">Endodoncia</option>
                <option value="ORTODONCIA">Ortodoncia</option>
                <option value="PROTESIS">Prótesis</option>
                <option value="CIRUGIA">Cirugía</option>
                <option value="CONTROL">Control</option>
                <option value="EMERGENCIA">Emergencia</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Fecha *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Duración (minutos) *</label>
                <input
                  type="number"
                  required
                  min="15"
                  step="15"
                  className="input-field"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Hora de Inicio *</label>
                <input
                  type="time"
                  required
                  className="input-field"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Hora de Fin</label>
                <input
                  type="time"
                  readOnly
                  className="input-field bg-gray-100"
                  value={formData.horaFin}
                />
              </div>
            </div>

            <div>
              <label className="label">Motivo de la Cita</label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="Describa el motivo de la cita..."
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Observaciones</label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="Notas adicionales..."
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/citas" className="btn-secondary">
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
                <span>Guardar Cita</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

