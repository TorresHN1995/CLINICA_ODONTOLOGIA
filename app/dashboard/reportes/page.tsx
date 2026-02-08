'use client'

import { useState, useEffect, useRef } from 'react'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, FileText, Loader2, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth } from 'date-fns'
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
  const [fechaInicio, setFechaInicio] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [fechaFin, setFechaFin] = useState(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchEstadisticas()
  }, [])

  const fetchEstadisticas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        fechaInicio,
        fechaFin,
      })
      const response = await fetch(`/api/reportes?${params}`)
      if (!response.ok) throw new Error('Error al cargar')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = async () => {
    if (!reportRef.current) return
    try {
      toast.loading('Generando PDF...')
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const canvas = await html2canvas(reportRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`reporte-${fechaInicio}-${fechaFin}.pdf`)
      toast.dismiss()
      toast.success('PDF generado')
    } catch {
      toast.dismiss()
      toast.error('Error al generar PDF')
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
        <h1 className="text-3xl font-bold text-foreground">Reportería y Estadísticas</h1>
        <p className="text-muted-foreground mt-1">Análisis y métricas de la clínica</p>
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
          <div className="flex items-end gap-3">
            <button onClick={fetchEstadisticas} className="btn-primary w-full">
              Generar Reporte
            </button>
            <button onClick={exportPDF} className="btn-secondary flex items-center space-x-2 whitespace-nowrap">
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div ref={reportRef} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Pacientes Nuevos</p>
              <p className="text-3xl font-bold mt-2">{stats.pacientesNuevos}</p>
              <p className="text-blue-100 text-sm mt-2">En el periodo</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Citas Completadas</p>
              <p className="text-3xl font-bold mt-2">{stats.citasCompletadas}</p>
              <p className="text-green-100 text-sm mt-2">En el periodo</p>
            </div>
            <Calendar className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Ingresos</p>
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
                {stats.citasCompletadas + stats.citasCanceladas > 0
                  ? `${Math.round((stats.citasCanceladas / (stats.citasCompletadas + stats.citasCanceladas)) * 100)}% del total`
                  : '0%'}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servicios Más Demandados */}
        <div className="card">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <span>Servicios Más Demandados</span>
          </h3>
          {stats.serviciosMasDemandados.length > 0 ? (
            <div className="space-y-4">
              {stats.serviciosMasDemandados.map((servicio, index) => {
                const maxCantidad = Math.max(
                  ...stats.serviciosMasDemandados.map((s) => s.cantidad)
                )
                const porcentaje = maxCantidad > 0 ? (servicio.cantidad / maxCantidad) * 100 : 0
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">{servicio.servicio}</span>
                      <span className="text-sm font-bold text-primary-600">{servicio.cantidad}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${porcentaje}%`, backgroundColor: 'rgb(var(--accent))' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay datos en este periodo</p>
          )}
        </div>

        {/* Ingresos Últimos 6 Meses */}
        <div className="card">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Ingresos Últimos 6 Meses</span>
          </h3>
          {stats.ingresosUltimosMeses.length > 0 ? (
            <div className="space-y-4">
              {stats.ingresosUltimosMeses.map((mes, index) => {
                const maxIngresos = Math.max(
                  ...stats.ingresosUltimosMeses.map((m) => m.ingresos)
                )
                const porcentaje = maxIngresos > 0 ? (mes.ingresos / maxIngresos) * 100 : 0
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground capitalize">{mes.mes}</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatearMoneda(mes.ingresos)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay datos</p>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
