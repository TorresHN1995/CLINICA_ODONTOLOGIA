'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevoOdontologoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    telefono: '',
    rol: 'ODONTOLOGO',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Odontólogo creado exitosamente')
        router.push('/dashboard/odontologos')
      } else {
        toast.error(data.error || 'Error al crear odontólogo')
      }
    } catch (error) {
      toast.error('Error al crear odontólogo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/odontologos"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nuevo Odontólogo</h1>
            <p className="text-muted-foreground mt-1">Registrar un nuevo profesional odontológico</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: María"
              />
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="apellido"
                required
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: García"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Usuario <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: dra.garcia"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este será el nombre de usuario para iniciar sesión
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: dra.garcia@clinica.com"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: +504 9999-9999"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 6 caracteres
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Link
              href="/dashboard/odontologos"
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Odontólogo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
