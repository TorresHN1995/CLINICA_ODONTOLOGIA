'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

interface Params {
  params: { id: string }
}

export default function EditarPacientePage({ params }: Params) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    identificacion: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    ciudad: '',
    ocupacion: '',
    contactoEmergencia: '',
    telefonoEmergencia: '',
    alergias: '',
    medicamentos: '',
    enfermedades: '',
    observaciones: '',
  })

  const cargar = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pacientes/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setFormData({
          identificacion: data.identificacion || '',
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          fechaNacimiento: data.fechaNacimiento ? String(data.fechaNacimiento).substring(0, 10) : '',
          email: data.email || '',
          telefono: data.telefono || '',
          celular: data.celular || '',
          direccion: data.direccion || '',
          ciudad: data.ciudad || '',
          ocupacion: data.ocupacion || '',
          contactoEmergencia: data.contactoEmergencia || '',
          telefonoEmergencia: data.telefonoEmergencia || '',
          alergias: data.alergias || '',
          medicamentos: data.medicamentos || '',
          enfermedades: data.enfermedades || '',
          observaciones: data.observaciones || '',
        })
      } else {
        toast.error(data.error || 'Error al cargar paciente')
      }
    } catch (e) {
      toast.error('Error al cargar paciente')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await fetch(`/api/pacientes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Paciente actualizado')
        router.push(`/dashboard/pacientes/${params.id}`)
      } else {
        toast.error(data.error || 'Error al actualizar paciente')
      }
    } catch (e) {
      toast.error('Error al actualizar paciente')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/pacientes/${params.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Paciente</h1>
            <p className="text-gray-600 mt-1">Actualiza la información del paciente</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Identificación *</label>
              <input type="text" name="identificacion" required className="input-field" value={formData.identificacion} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Fecha de Nacimiento *</label>
              <input type="date" name="fechaNacimiento" required className="input-field" value={formData.fechaNacimiento} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input type="text" name="nombre" required className="input-field" value={formData.nombre} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input type="text" name="apellido" required className="input-field" value={formData.apellido} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Ocupación</label>
              <input type="text" name="ocupacion" className="input-field" value={formData.ocupacion} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información de Contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Teléfono *</label>
              <input type="tel" name="telefono" required className="input-field" value={formData.telefono} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Celular</label>
              <input type="tel" name="celular" className="input-field" value={formData.celular} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input type="text" name="ciudad" className="input-field" value={formData.ciudad} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Dirección</label>
              <input type="text" name="direccion" className="input-field" value={formData.direccion} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Contacto de Emergencia */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Contacto de Emergencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Nombre del Contacto</label>
              <input type="text" name="contactoEmergencia" className="input-field" value={formData.contactoEmergencia} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Teléfono de Emergencia</label>
              <input type="tel" name="telefonoEmergencia" className="input-field" value={formData.telefonoEmergencia} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Historia Médica */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Historia Médica</h2>
          <div className="space-y-6">
            <div>
              <label className="label">Alergias</label>
              <textarea name="alergias" rows={3} className="input-field" value={formData.alergias} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Medicamentos Actuales</label>
              <textarea name="medicamentos" rows={3} className="input-field" value={formData.medicamentos} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Enfermedades Crónicas</label>
              <textarea name="enfermedades" rows={3} className="input-field" value={formData.enfermedades} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Observaciones Adicionales</label>
              <textarea name="observaciones" rows={3} className="input-field" value={formData.observaciones} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href={`/dashboard/pacientes/${params.id}`} className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary flex items-center space-x-2">
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


