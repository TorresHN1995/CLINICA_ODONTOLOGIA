'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-600 mb-6">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <button onClick={reset} className="btn-primary">
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
