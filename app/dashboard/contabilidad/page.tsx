'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'

interface Estadisticas {
  resumen: {
    ingresosMes: number
    egresosMes: number
    gananciaMes: number
    saldoActual: number
  }
  ingresosPorCategoria: Array<{
    categoria: string
    monto: number
    cantidad: number
  }>
  egresosPorCategoria: Array<{
    categoria: string
    monto: number
    cantidad: number
  }>
  ultimosMeses: Array<{
    mes: string
    ingresos: number
    egresos: number
    ganancia: number
  }>
}

export default function ContabilidadPage() {
  const { formatearMoneda } = useConfiguracion()
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchEstadisticas()
  }, [])

  const fetchEstadisticas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contabilidad/estadisticas')
      const data = await response.json()

      if (response.ok) {
        setEstadisticas(data)
      } else {
        toast.error('Error al cargar estadísticas')
      }
    } catch (error) {
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'MATERIALES_DENTALES': 'Materiales Dentales',
      'INSTRUMENTAL': 'Instrumental',
      'MEDICAMENTOS': 'Medicamentos',
      'EQUIPAMIENTO': 'Equipamiento',
      'SERVICIOS_PUBLICOS': 'Servicios Públicos',
      'ALQUILER': 'Alquiler',
      'SALARIOS': 'Salarios',
      'SEGUROS': 'Seguros',
      'MANTENIMIENTO': 'Mantenimiento',
      'MARKETING': 'Marketing',
      'CAPACITACION': 'Capacitación',
      'OTROS_GASTOS': 'Otros Gastos',
      'PAGADA': 'Facturas Pagadas',
      'PAGADA_PARCIAL': 'Facturas Parciales',
      'PENDIENTE': 'Facturas Pendientes',
    }
    return labels[categoria] || categoria
  }

  if (loading || !estadisticas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contabilidad</h1>
          <p className="text-muted-foreground mt-1">
            Control financiero de la clínica
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => toast('Función en desarrollo', { icon: 'ℹ️' })}
            className="btn-secondary flex items-center space-x-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Reportes</span>
          </button>
          <button
            onClick={() => window.open('/dashboard/contabilidad/egreso', '_blank')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ingresos del Mes</p>
              <p className="text-3xl font-bold mt-2">
                {formatearMoneda(estadisticas.resumen.ingresosMes)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Egresos del Mes</p>
              <p className="text-3xl font-bold mt-2">
                {formatearMoneda(estadisticas.resumen.egresosMes)}
              </p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Ganancia del Mes</p>
              <p className={`text-3xl font-bold mt-2 ${estadisticas.resumen.gananciaMes >= 0 ? 'text-white' : 'text-red-200'
                }`}>
                {formatearMoneda(estadisticas.resumen.gananciaMes)}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Saldo Actual</p>
              <p className="text-3xl font-bold mt-2">
                {formatearMoneda(estadisticas.resumen.saldoActual)}
              </p>
            </div>
            <Wallet className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por Categoría */}
        <div className="card">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Ingresos por Estado</span>
          </h3>
          <div className="space-y-3">
            {estadisticas.ingresosPorCategoria.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">{getCategoriaLabel(item.categoria)}</p>
                  <p className="text-sm text-green-700">{item.cantidad} facturas</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatearMoneda(item.monto)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Egresos por Categoría */}
        <div className="card">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span>Egresos por Categoría</span>
          </h3>
          <div className="space-y-3">
            {estadisticas.egresosPorCategoria.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">{getCategoriaLabel(item.categoria)}</p>
                  <p className="text-sm text-red-700">{item.cantidad} gastos</p>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {formatearMoneda(item.monto)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolución de Últimos 6 Meses */}
      <div className="card">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>Evolución de Últimos 6 Meses</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Egresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ganancia
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {estadisticas.ultimosMeses.map((mes, index) => (
                <tr key={index} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                    {mes.mes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                    {formatearMoneda(mes.ingresos)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                    {formatearMoneda(mes.egresos)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap font-medium ${mes.ganancia >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {formatearMoneda(mes.ganancia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="card">
        <h3 className="text-lg font-bold text-foreground mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.open('/dashboard/contabilidad/egreso', '_blank')}
            className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-center"
          >
            <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-900">Registrar Gasto</p>
          </button>
          <button
            onClick={() => toast('Función en desarrollo', { icon: 'ℹ️' })}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
          >
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-900">Reportes Detallados</p>
          </button>
          <button
            onClick={() => toast('Función en desarrollo', { icon: 'ℹ️' })}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
          >
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">Exportar Datos</p>
          </button>
        </div>
      </div>
    </div>
  )
}
