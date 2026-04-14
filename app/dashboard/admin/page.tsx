'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Download, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')

  const handleExportDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/database/export')
      
      if (!response.ok) {
        throw new Error('Error al exportar base de datos')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clinica-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Base de datos exportada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al exportar base de datos')
    } finally {
      setLoading(false)
    }
  }

  const handleClearDatabase = async () => {
    if (clearConfirmText !== 'LIMPIAR_BASE_DE_DATOS') {
      toast.error('Confirmación incorrecta')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/database/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmacion: 'LIMPIAR_BASE_DE_DATOS' }),
      })

      if (!response.ok) {
        throw new Error('Error al limpiar base de datos')
      }

      const data = await response.json()
      
      toast.success('Base de datos limpiada exitosamente')
      setClearConfirmText('')
      setShowClearConfirm(false)
      
      // Recargar página después de 2 segundos
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al limpiar base de datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Administración</h1>
          <p className="text-slate-600">Gestión de base de datos y configuración del sistema</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-500">
            <div className="flex items-center mb-4">
              <Download className="w-8 h-8 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900">Exportar Base de Datos</h2>
            </div>
            
            <p className="text-slate-600 mb-6">
              Descarga un backup completo de toda la base de datos en formato JSON. Incluye todos los registros de pacientes, facturas, citas y más.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Incluye:</strong> Usuarios, Pacientes, Citas, Expedientes, Tratamientos, Facturas, Pagos, Ingresos, Egresos, Inventario y Documentos.
              </p>
            </div>

            <button
              onClick={handleExportDatabase}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {loading ? 'Exportando...' : 'Descargar Backup'}
            </button>
          </div>

          {/* Clear Database Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-500">
            <div className="flex items-center mb-4">
              <Trash2 className="w-8 h-8 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900">Limpiar Base de Datos</h2>
            </div>
            
            <p className="text-slate-600 mb-6">
              Elimina todos los datos de la base de datos. Esta acción es irreversible. Se recomienda hacer un backup antes.
            </p>

            <div className="bg-red-50 rounded-lg p-4 mb-6 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">
                <strong>Advertencia:</strong> Esta acción eliminará permanentemente todos los datos. No se puede deshacer.
              </p>
            </div>

            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {loading ? 'Limpiando...' : 'Limpiar Base de Datos'}
            </button>
          </div>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                ¿Limpiar Base de Datos?
              </h3>

              <p className="text-slate-600 text-center mb-6">
                Esta acción eliminará permanentemente todos los datos del sistema. Escribe la confirmación para continuar.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Escribe: <code className="bg-slate-100 px-2 py-1 rounded">LIMPIAR_BASE_DE_DATOS</code>
                </label>
                <input
                  type="text"
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value)}
                  placeholder="LIMPIAR_BASE_DE_DATOS"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowClearConfirm(false)
                    setClearConfirmText('')
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearDatabase}
                  disabled={clearConfirmText !== 'LIMPIAR_BASE_DE_DATOS' || loading}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Limpiando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Información del Sistema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Exportar Datos</p>
                <p className="text-sm text-slate-600">Descarga un backup completo en JSON</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Limpiar Datos</p>
                <p className="text-sm text-slate-600">Elimina todos los registros del sistema</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Seguridad</p>
                <p className="text-sm text-slate-600">Solo administradores pueden acceder</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Confirmación</p>
                <p className="text-sm text-slate-600">Requiere confirmación para limpiar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
