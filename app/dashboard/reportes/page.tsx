'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/components/providers/ConfiguracionProvider'

interface Estadisticas {
  pacientesNuevos: number
  citasCompletadas: number
  citasCanceladas: number
  ingresosMes: number
  serviciosMasDemandados: Array<{ servicio: string; cantidad: number }>
  ingresosUltimosMeses: Array<{ mes: string; ingresos: number }>
}

export default function ReportesPage() {
  const { formatearMoneda } = useConfiguracion()
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchEstadisticas()
  }, [])

  const fetchEstadisticas = async () => {
    try {
      setLoading(true)
      // Simulación de datos - en producción esto vendría de la API
      const mockStats = {
        pacientesNuevos: 45,
        citasCompletadas: 124,
        citasCanceladas: 8,
        ingresosMes: 125000,
        serviciosMasDemandados: [
          { servicio: 'Limpieza', cantidad: 45 },
          { servicio: 'Consulta', cantidad: 38 },
          { servicio: 'Ortodoncia', cantidad: 22 },
          { servicio: 'Endodoncia', cantidad: 15 },
          { servicio: 'Extracción', cantidad: 12 },
        ],
        ingresosUltimosMeses: [
          { mes: 'Enero', ingresos: 98000 },
          { mes: 'Febrero', ingresos: 105000 },
          { mes: 'Marzo', ingresos: 115000 },
          { mes: 'Abril', ingresos: 108000 },
          { mes: 'Mayo', ingresos: 120000 },
          { mes: 'Junio', ingresos: 125000 },
        ],
      }
      setStats(mockStats)
    } catch (error) {
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportería y Estadísticas</h1>
        <p className="text-gray-600 mt-1">
          Análisis y métricas de la clínica
        </p>
      </div>

      {/* Filtros de Fecha */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Fecha Inicio</label>
            <input
              type="date"
              className="input-field"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fecha Fin</label>
            <input
              type="date"
              className="input-field"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchEstadisticas}
              className="btn-primary w-full"
            >
              Generar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Pacientes Nuevos</p>
              <p className="text-3xl font-bold mt-2">{stats.pacientesNuevos}</p>
              <p className="text-blue-100 text-sm mt-2">Este mes</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Citas Completadas</p>
              <p className="text-3xl font-bold mt-2">{stats.citasCompletadas}</p>
              <p className="text-green-100 text-sm mt-2">Este mes</p>
            </div>
            <Calendar className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Ingresos del Mes</p>
              <p className="text-3xl font-bold mt-2">{formatearMoneda(stats.ingresosMes)}</p>
              <p className="text-purple-100 text-sm mt-2">Total</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Citas Canceladas</p>
              <p className="text-3xl font-bold mt-2">{stats.citasCanceladas}</p>
              <p className="text-red-100 text-sm mt-2">
                {Math.round((stats.citasCanceladas / (stats.citasCompletadas + stats.citasCanceladas)) * 100)}% del total
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servicios Más Demandados */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <span>Servicios Más Demandados</span>
          </h3>
          <div className="space-y-4">
            {stats.serviciosMasDemandados.map((servicio: any, index: number) => {
              const maxCantidad = Math.max(...stats.serviciosMasDemandados.map((s: any) => s.cantidad))
              const porcentaje = (servicio.cantidad / maxCantidad) * 100

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{servicio.servicio}</span>
                    <span className="text-sm font-bold text-primary-600">{servicio.cantidad}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Ingresos Últimos 6 Meses */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Ingresos Últimos 6 Meses</span>
          </h3>
          <div className="space-y-4">
            {stats.ingresosUltimosMeses.map((mes: any, index: number) => {
              const maxIngresos = Math.max(...stats.ingresosUltimosMeses.map((m: any) => m.ingresos))
              const porcentaje = (mes.ingresos / maxIngresos) * 100

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{mes.mes}</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatearMoneda(mes.ingresos)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Acciones de Exportación */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Exportar Reportes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Exportar a PDF</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Exportar a Excel</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Enviar por Email</span>
          </button>
        </div>
      </div>
    </div>
  )
}

