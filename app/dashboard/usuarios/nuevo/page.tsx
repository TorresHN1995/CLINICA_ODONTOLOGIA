'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    telefono: '',
    rol: 'RECEPCION',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Usuario creado')
        router.push('/dashboard/usuarios')
      } else {
        toast.error(data.error || 'Error al crear usuario')
      }
    } catch (e) {
      toast.error('Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/usuarios" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Usuario</h1>
          <p className="text-gray-600 mt-1">Crea una cuenta para un miembro del equipo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información del Usuario</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Email *</label>
              <input name="email" type="email" required className="input-field" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Contraseña *</label>
              <input name="password" type="password" required className="input-field" value={formData.password} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Nombre *</label>
                <input name="nombre" type="text" required className="input-field" value={formData.nombre} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Apellido *</label>
                <input name="apellido" type="text" required className="input-field" value={formData.apellido} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input name="telefono" type="tel" className="input-field" value={formData.telefono} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Rol *</label>
              <select name="rol" className="input-field" value={formData.rol} onChange={handleChange}>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="ODONTOLOGO">Odontólogo</option>
                <option value="ASISTENTE">Asistente</option>
                <option value="RECEPCION">Recepción</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href="/dashboard/usuarios" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center space-x-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Crear Usuario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


