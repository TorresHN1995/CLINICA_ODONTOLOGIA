'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { User, Lock, Loader2 } from 'lucide-react'

type UsuarioOption = {
  username: string
  nombre: string
  apellido: string
  rol: string
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/usuarios/public', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: UsuarioOption[]) => {
        if (!cancelled) setUsuarios(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setUsuarios([])
      })
      .finally(() => {
        if (!cancelled) setLoadingUsuarios(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) {
      toast.error('Usuario o contraseña incorrectos')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const rawCallback =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('callbackUrl')
          : null
      const callbackUrl = rawCallback ? decodeURIComponent(rawCallback) : '/dashboard'

      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      })

      if (!result) {
        toast.error('No se recibió respuesta del servidor')
        setLoading(false)
        return
      }

      if (result.error) {
        toast.error('Usuario o contraseña incorrectos')
        setLoading(false)
        return
      }

      if (result.ok) {
        toast.success('¡Bienvenido!')
        let target = callbackUrl
        if (target.startsWith('http')) {
          try {
            const u = new URL(target)
            target = u.pathname + u.search
          } catch {
            target = '/dashboard'
          }
        }
        // Esperar a que la cookie de sesión se comprometa en document.cookie
        // antes de navegar, si no el middleware no la ve y nos devuelve al login.
        await new Promise((r) => setTimeout(r, 250))
        // Navegación dura: fuerza al browser a incluir la cookie en el próximo request.
        window.location.assign(target)
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
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none z-10" />
                <select
                  required
                  disabled={loadingUsuarios}
                  className="input-field pl-10 appearance-none"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                >
                  <option value="" disabled>
                    {loadingUsuarios
                      ? 'Cargando usuarios...'
                      : usuarios.length === 0
                        ? 'No hay usuarios disponibles'
                        : 'Selecciona un usuario'}
                  </option>
                  {usuarios.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.nombre} {u.apellido} ({u.username})
                    </option>
                  ))}
                </select>
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

