'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2, Wand2 } from 'lucide-react'
import Link from 'next/link'
import Odontograma from '@/components/odontograma/Odontograma'
import { Combobox } from '@/components/ui/Combobox'
import { OdontogramaData, generarDiagnostico } from '@/lib/odontograma'

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
  const [odontogramaData, setOdontogramaData] = useState<OdontogramaData>({})
  // Mientras el odontólogo no escriba en el diagnóstico, el texto se mantiene
  // sincronizado con el odontograma. En cuanto lo edita, su redacción manda.
  const [diagnosticoEditado, setDiagnosticoEditado] = useState(false)
  const diagnosticoRef = useRef<HTMLTextAreaElement>(null)
  const [formData, setFormData] = useState({
    pacienteId: '',
    diagnostico: '',
    tratamiento: '',
    evolucion: '',
    proximaCita: '',
  })

  useEffect(() => {
    fetchPacientes()
    // Preseleccionar paciente si viene en la URL (?pacienteId=...), p.ej. al abrir
    // el historial desde una cita cuyo paciente aún no tiene expediente.
    const pid = new URLSearchParams(window.location.search).get('pacienteId')
    if (pid) setFormData((prev) => ({ ...prev, pacienteId: pid }))
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

  const handleOdontogramaChange = (data: OdontogramaData) => {
    setOdontogramaData(data)
    if (!diagnosticoEditado) {
      setFormData((prev) => ({ ...prev, diagnostico: generarDiagnostico(data) }))
    }
  }

  const redactarDesdeOdontograma = () => {
    const texto = generarDiagnostico(odontogramaData)
    if (!texto) {
      toast('Marca primero el estado de alguna pieza en el odontograma', { icon: '🦷' })
      return
    }
    setFormData((prev) => ({ ...prev, diagnostico: texto }))
    setDiagnosticoEditado(false)
    diagnosticoRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pacienteId) {
      toast.error('Selecciona un paciente')
      return
    }

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

      const data = await response.json()

      if (response.ok) {
        toast.success('Expediente creado exitosamente')
        router.push(`/dashboard/expedientes/${data.id}`)
      } else {
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
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Expediente Clínico</h1>
          <p className="text-muted-foreground mt-1">Registra un nuevo expediente odontológico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Paciente */}
        <div className="card">
          <h2 className="text-xl font-bold text-foreground mb-6">Seleccionar Paciente</h2>
          <div>
            <label className="label">Paciente *</label>
            <Combobox
              options={pacientes.map((p) => ({
                id: p.id,
                label: `${p.nombre} ${p.apellido} - ${p.identificacion}`,
              }))}
              value={formData.pacienteId}
              onChange={(value) => setFormData({ ...formData, pacienteId: value })}
              placeholder="Seleccione un paciente"
              searchPlaceholder="Buscar por nombre o identificación..."
              emptyMessage="No se encontraron pacientes."
            />
          </div>
        </div>

        {/* Odontograma */}
        <div className="card">
          <h2 className="text-xl font-bold text-foreground mb-6">Odontograma</h2>
          <Odontograma data={odontogramaData} editable={true} onChange={handleOdontogramaChange} />
        </div>

        {/* Diagnóstico y Tratamiento */}
        <div className="card">
          <h2 className="text-xl font-bold text-foreground mb-6">Diagnóstico y Tratamiento</h2>
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="label mb-0">Diagnóstico *</label>
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
                ref={diagnosticoRef}
                required
                rows={6}
                className="input-field"
                placeholder="Marca las piezas en el odontograma y el diagnóstico se redacta solo. También puedes escribirlo aquí."
                value={formData.diagnostico}
                onChange={(e) => {
                  setDiagnosticoEditado(true)
                  setFormData({ ...formData, diagnostico: e.target.value })
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {diagnosticoEditado
                  ? 'Estás editando el texto: el odontograma ya no lo sobrescribe. Usa «Redactar desde el odontograma» para volver a generarlo.'
                  : 'Se actualiza automáticamente con cada pieza que marcas. Puedes editarlo cuando quieras.'}
              </p>
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
              <p className="mt-1 text-xs text-muted-foreground">
                Es solo un recordatorio. Para reservar el cupo en la agenda, abre el expediente y usa
                «Programar próxima cita».
              </p>
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
