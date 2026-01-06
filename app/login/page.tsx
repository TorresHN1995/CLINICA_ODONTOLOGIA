'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { User, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const callbackUrl = decodeURIComponent(searchParams.get('callbackUrl') || '/dashboard')
      
      // Intentar login con redirect automático
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Credenciales inválidas')
        setLoading(false)
      } else if (result?.ok) {
        toast.success('¡Bienvenido!')
        
        // Esperar un momento para que la cookie se establezca
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Redirigir usando el callbackUrl completo o solo la ruta
        let redirectUrl = callbackUrl
        if (callbackUrl.startsWith('http')) {
          // Si es una URL completa, extraer solo la ruta
          try {
            const url = new URL(callbackUrl)
            redirectUrl = url.pathname + url.search
          } catch {
            redirectUrl = '/dashboard'
          }
        }
        
        // Forzar recarga completa con la URL correcta
        window.location.href = redirectUrl
      }
    } catch (error) {
      console.error('Error en login:', error)
      toast.error('Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-dental-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clínica Odontológica
          </h1>
          <p className="text-gray-600">
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
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Usuario por defecto:</p>
            <p className="font-mono text-xs mt-1">admin / admin123</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          © 2024 Clínica Odontológica. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

