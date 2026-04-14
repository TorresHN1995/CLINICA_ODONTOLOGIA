'use client'

import { useState, useEffect } from 'react'
import { FileText, Printer, Download, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Paciente {
  id: string
  nombre: string
  apellido: string
  identificacion: string
}

export default function DocumentosPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [tipoDoc, setTipoDoc] = useState<'RECETA' | 'CONSENTIMIENTO' | 'ORDEN_LABORATORIO'>('RECETA')
  const [pacienteId, setPacienteId] = useState('')
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [loading, setLoading] = useState(false)

  // Estados para cada tipo de documento
  const [receta, setReceta] = useState({
    medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }],
    observaciones: '',
  })

  const [consentimiento, setConsentimiento] = useState({
    procedimiento: '',
    riesgos: '',
    alternativas: '',
    observaciones: '',
  })

  const [ordenLab, setOrdenLab] = useState({
    tipoTrabajo: '',
    descripcion: '',
    especificaciones: [''],
    color: '',
    material: '',
    fechaEntrega: '',
    observaciones: '',
  })

  useEffect(() => {
    fetchPacientes()
  }, [])

  const fetchPacientes = async () => {
    try {
      const res = await fetch('/api/pacientes')
      if (res.ok) {
        const data = await res.json()
        setPacientes(data.pacientes || [])
      }
    } catch (error) {
      console.error('Error cargando pacientes')
    }
  }

  const agregarMedicamento = () => {
    setReceta({
      ...receta,
      medicamentos: [...receta.medicamentos, { nombre: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }],
    })
  }

  const actualizarMedicamento = (index: number, field: string, value: string) => {
    const nuevos = [...receta.medicamentos]
    nuevos[index] = { ...nuevos[index], [field]: value }
    setReceta({ ...receta, medicamentos: nuevos })
  }

  const agregarEspecificacion = () => {
    setOrdenLab({
      ...ordenLab,
      especificaciones: [...ordenLab.especificaciones, ''],
    })
  }

  const actualizarEspecificacion = (index: number, value: string) => {
    const nuevas = [...ordenLab.especificaciones]
    nuevas[index] = value
    setOrdenLab({ ...ordenLab, especificaciones: nuevas })
  }

  const generarDocumento = async () => {
    if (!pacienteId) {
      toast.error('Selecciona un paciente')
      return
    }

    setLoading(true)
    try {
      let contenido: any = {}

      if (tipoDoc === 'RECETA') {
        contenido = receta
      } else if (tipoDoc === 'CONSENTIMIENTO') {
        contenido = consentimiento
      } else if (tipoDoc === 'ORDEN_LABORATORIO') {
        contenido = ordenLab
      }

      const res = await fetch('/api/documentos/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoDoc,
          pacienteId,
          contenido,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedHTML(data.html)
        toast.success('Documento generado')
      } else {
        toast.error('Error al generar documento')
      }
    } catch (error) {
      toast.error('Error al generar documento')
    } finally {
      setLoading(false)
    }
  }

  const imprimirDocumento = () => {
    if (!generatedHTML) return
    const ventana = window.open('', '_blank')
    if (ventana) {
      ventana.document.write(generatedHTML)
      ventana.document.close()
      ventana.print()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generador de Documentos</h1>
        <p className="text-muted-foreground mt-1">Crea recetas, consentimientos y órdenes de laboratorio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h3 className="font-semibold text-lg mb-4">Información del Documento</h3>

            {/* Tipo de Documento */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'RECETA', label: 'Receta', icon: '💊' },
                  { value: 'CONSENTIMIENTO', label: 'Consentimiento', icon: '📋' },
                  { value: 'ORDEN_LABORATORIO', label: 'Orden Lab', icon: '🔬' },
                ].map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => setTipoDoc(tipo.value as any)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      tipoDoc === tipo.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <div>{tipo.icon}</div>
                    <div className="text-xs mt-1">{tipo.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paciente */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Paciente</label>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} - {p.identificacion}
                  </option>
                ))}
              </select>
            </div>

            {/* Formulario según tipo */}
            {tipoDoc === 'RECETA' && (
              <div className="space-y-4">
                <h4 className="font-medium">Medicamentos</h4>
                {receta.medicamentos.map((med, idx) => (
                  <div key={idx} className="p-4 bg-muted rounded-lg space-y-2">
                    <input
                      type="text"
                      placeholder="Nombre del medicamento"
                      className="w-full px-3 py-2 border border-border rounded"
                      value={med.nombre}
                      onChange={(e) => actualizarMedicamento(idx, 'nombre', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Dosis"
                        className="px-3 py-2 border border-border rounded"
                        value={med.dosis}
                        onChange={(e) => actualizarMedicamento(idx, 'dosis', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Frecuencia"
                        className="px-3 py-2 border border-border rounded"
                        value={med.frecuencia}
                        onChange={(e) => actualizarMedicamento(idx, 'frecuencia', e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Duración"
                      className="w-full px-3 py-2 border border-border rounded"
                      value={med.duracion}
                      onChange={(e) => actualizarMedicamento(idx, 'duracion', e.target.value)}
                    />
                    <textarea
                      placeholder="Indicaciones adicionales"
                      className="w-full px-3 py-2 border border-border rounded"
                      rows={2}
                      value={med.indicaciones}
                      onChange={(e) => actualizarMedicamento(idx, 'indicaciones', e.target.value)}
                    />
                  </div>
                ))}
                <button
                  onClick={agregarMedicamento}
                  className="w-full py-2 border-2 border-dashed border-border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Agregar Medicamento
                </button>
                <textarea
                  placeholder="Observaciones generales"
                  className="w-full px-3 py-2 border border-border rounded"
                  rows={3}
                  value={receta.observaciones}
                  onChange={(e) => setReceta({ ...receta, observaciones: e.target.value })}
                />
              </div>
            )}

            {tipoDoc === 'CONSENTIMIENTO' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Procedimiento"
                  className="w-full px-3 py-2 border border-border rounded"
                  value={consentimiento.procedimiento}
                  onChange={(e) => setConsentimiento({ ...consentimiento, procedimiento: e.target.value })}
                />
                <textarea
                  placeholder="Riesgos explicados"
                  className="w-full px-3 py-2 border border-border rounded"
                  rows={3}
                  value={consentimiento.riesgos}
                  onChange={(e) => setConsentimiento({ ...consentimiento, riesgos: e.target.value })}
                />
                <textarea
                  placeholder="Alternativas de tratamiento"
                  className="w-full px-3 py-2 border border-border rounded"
                  rows={3}
                  value={consentimiento.alternativas}
                  onChange={(e) => setConsentimiento({ ...consentimiento, alternativas: e.target.value })}
                />
                <textarea
                  placeholder="Observaciones adicionales"
                  className="w-full px-3 py-2 border border-border rounded"
                  rows={2}
                  value={consentimiento.observaciones}
                  onChange={(e) => setConsentimiento({ ...consentimiento, observaciones: e.target.value })}
                />
              </div>
            )}

            {tipoDoc === 'ORDEN_LABORATORIO' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Tipo de trabajo (ej: Corona, Prótesis)"
                  className="w-full px-3 py-2 border border-border rounded"
                  value={ordenLab.tipoTrabajo}
                  onChange={(e) => setOrdenLab({ ...ordenLab, tipoTrabajo: e.target.value })}
                />
                <textarea
                  placeholder="Descripción del trabajo"
                  className="w-full px-3 py-2 border border-border rounded"
                  rows={3}
                  value={ordenLab.descripcion}
                  onChange={(e) => setOrdenLab({ ...ordenLab, descripcion: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Especificaciones</label>
                  {ordenLab.especificaciones.map((esp, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Especificación ${idx + 1}`}
                      className="w-full px-3 py-2 border border-border rounded mb-2"
                      value={esp}
                      onChange={(e) => actualizarEspecificacion(idx, e.target.value)}
                    />
                  ))}
                  <button
                    onClick={agregarEspecificacion}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Agregar especificación
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Color"
                    className="px-3 py-2 border border-border rounded"
                    value={ordenLab.color}
                    onChange={(e) => setOrdenLab({ ...ordenLab, color: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Material"
                    className="px-3 py-2 border border-border rounded"
                    value={ordenLab.material}
                    onChange={(e) => setOrdenLab({ ...ordenLab, material: e.target.value })}
                  />
                </div>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded"
                  value={ordenLab.fechaEntrega}
                  onChange={(e) => setOrdenLab({ ...ordenLab, fechaEntrega: e.target.value })}
                />
                <textarea
                  placeholder="Observaciones"
                  className="w-full px-3 py-2 border border-border rounded"
                  rows={2}
                  value={ordenLab.observaciones}
                  onChange={(e) => setOrdenLab({ ...ordenLab, observaciones: e.target.value })}
                />
              </div>
            )}

            <button
              onClick={generarDocumento}
              disabled={loading}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar Documento'}
            </button>
          </div>
        </div>

        {/* Vista Previa */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Vista Previa</h3>
            {generatedHTML && (
              <button
                onClick={imprimirDocumento}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            )}
          </div>
          {generatedHTML ? (
            <div
              className="border border-border rounded-lg p-4 bg-white overflow-auto max-h-[600px]"
              dangerouslySetInnerHTML={{ __html: generatedHTML }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p>El documento generado aparecerá aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
