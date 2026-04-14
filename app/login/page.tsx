'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { User, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Obtener el callbackUrl del query string
      const rawCallback =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('callbackUrl')
          : null
      const callbackUrl = rawCallback ? decodeURIComponent(rawCallback) : '/dashboard'
      
      // Usar signIn con redirect: true para que NextAuth maneje todo
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: true,
        callbackUrl: callbackUrl,
      })

      // Si llegamos aquí, hubo un error (signIn con redirect: true no retorna si es exitoso)
      if (result?.error) {
        toast.error('Usuario o contraseña incorrectos')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error en login:', error)
      toast.error('Error al iniciar sesión. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-dental-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: 'rgb(var(--accent))' }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Clínica Odontológica
          </h1>
          <p className="text-muted-foreground">
            Sistema de Gestión Integral
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="card animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="nombre.usuario"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="password"
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          &copy; {new Date().getFullYear()} Clínica Odontológica. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

