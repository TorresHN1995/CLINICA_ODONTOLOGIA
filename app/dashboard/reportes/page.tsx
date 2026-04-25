'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, Users, DollarSign, Activity, AlertCircle, Download, FileText, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import { generarTicketReporte } from '@/lib/generar-ticket-reporte'

interface ReporteFinanciero {
  periodo: { mes: number; año: number; fechaInicio: string; fechaFin: string }
  resumen: {
    totalFacturas: number
    totalPagos: number
    totalIngresos: number
    totalEgresos: number
    utilidad: number
    margenUtilidad: string
    saldoPendiente: number
  }
  facturas: {
    cantidad: number
    porEstado: Record<string, number>
    montosPorEstado: Record<string, number>
  }
  pagos: {
    cantidad: number
    metodosPago: Record<string, number>
  }
  egresos: {
    cantidad: number
    porCategoria: Record<string, number>
  }
  topPacientes: Array<{ nombre: string; total: number }>
}

interface ReporteClinico {
  periodo: { mes: number; año: number; fechaInicio: string; fechaFin: string }
  resumen: {
    citasTotal: number
    expedientesCreados: number
    tratamientosCreados: number
    procedimientosRealizados: number
    pacientesAtendidos: number
    tasaAsistencia: number
  }
  citas: {
    porEstado: Record<string, number>
    porTipo: Record<string, number>
    completadas: number
    noAsistio: number
  }
  tratamientos: {
    porEstado: Record<string, number>
    costoTotal: number
    costoPromedio: string
  }
  procedimientos: {
    cantidad: number
    costoTotal: number
    costoPromedio: string
    porTipo: Record<string, number>
    topProcedimientos: Array<{ nombre: string; cantidad: number }>
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<'financiero' | 'clinico'>('financiero')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [año, setAño] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [reporteFinanciero, setReporteFinanciero] = useState<ReporteFinanciero | null>(null)
  const [reporteClinico, setReporteClinico] = useState<ReporteClinico | null>(null)
  const [generando, setGenerando] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Cerrar menú de exportación al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => setShowExportMenu(false)
    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showExportMenu])

  const generarTicket = async (formato: 'pdf' | 'png') => {
    setShowExportMenu(false)
    try {
      setGenerando(true)
      toast.loading('Generando ticket...', { id: 'ticket' })

      // Obtener datos de empresa
      const resEmpresa = await fetch('/api/configuracion-empresa')
      const empresa = resEmpresa.ok
        ? await resEmpresa.json()
        : { nombre: 'Clínica Dental', rtn: null, telefono: null, email: null, direccion: null, ciudad: null }

      if (activeTab === 'financiero' && reporteFinanciero) {
        await generarTicketReporte({
          tipo: 'financiero',
          formato,
          mes,
          año,
          empresa,
          financiero: {
            totalIngresos: reporteFinanciero.resumen.totalIngresos,
            totalEgresos: reporteFinanciero.resumen.totalEgresos,
            utilidad: reporteFinanciero.resumen.utilidad,
            margenUtilidad: reporteFinanciero.resumen.margenUtilidad,
            totalFacturas: reporteFinanciero.resumen.totalFacturas,
            totalPagos: reporteFinanciero.resumen.totalPagos,
            saldoPendiente: reporteFinanciero.resumen.saldoPendiente,
            facturasQty: reporteFinanciero.facturas.cantidad,
            facturasEstado: reporteFinanciero.facturas.porEstado,
            egresosQty: reporteFinanciero.egresos.cantidad,
            metodosPago: reporteFinanciero.pagos.metodosPago,
          },
        })
      } else if (activeTab === 'clinico' && reporteClinico) {
        await generarTicketReporte({
          tipo: 'clinico',
          formato,
          mes,
          año,
          empresa,
          clinico: {
            citasTotal: reporteClinico.resumen.citasTotal,
            pacientesAtendidos: reporteClinico.resumen.pacientesAtendidos,
            tasaAsistencia: reporteClinico.resumen.tasaAsistencia,
            procedimientosRealizados: reporteClinico.resumen.procedimientosRealizados,
            expedientesCreados: reporteClinico.resumen.expedientesCreados,
            tratamientosCreados: reporteClinico.resumen.tratamientosCreados,
            citasCompletadas: reporteClinico.citas.completadas,
            citasNoAsistio: reporteClinico.citas.noAsistio,
            costoTotalTratamientos: reporteClinico.tratamientos.costoTotal,
            costoPromedioTratamientos: reporteClinico.tratamientos.costoPromedio,
          },
        })
      }

      toast.success(`Ticket generado en ${formato.toUpperCase()}`, { id: 'ticket' })
    } catch (error) {
      console.error('Error generando ticket:', error)
      toast.error('Error al generar el ticket', { id: 'ticket' })
    } finally {
      setGenerando(false)
    }
  }

  const cargarReportes = async () => {
    try {
      setLoading(true)
      const [resFinanciero, resClinico] = await Promise.all([
        fetch(`/api/reportes/financiero?mes=${mes}&año=${año}`),
        fetch(`/api/reportes/clinico?mes=${mes}&año=${año}`),
      ])

      if (!resFinanciero.ok || !resClinico.ok) {
        throw new Error('Error al cargar reportes')
      }

      const dataFinanciero = await resFinanciero.json()
      const dataClinico = await resClinico.json()

      setReporteFinanciero(dataFinanciero)
      setReporteClinico(dataClinico)
      toast.success('Reportes cargados exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarReportes()
  }, [mes, año])

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground">Análisis financiero y clínico del sistema</p>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div>
              <label className="label">Mes</label>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="input-field"
              >
                {meses.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Año</label>
              <select
                value={año}
                onChange={(e) => setAño(parseInt(e.target.value))}
                className="input-field"
              >
                {años.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <button
              onClick={cargarReportes}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>

            {/* Botón Generar Ticket */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={generando || loading || (!reporteFinanciero && !reporteClinico)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {generando ? 'Generando...' : 'Generar Ticket'}
              </button>
              {showExportMenu && (
                <div className="absolute top-full mt-2 right-0 bg-card rounded-lg shadow-xl border border-border py-2 z-50 min-w-[180px]">
                  <button
                    onClick={() => generarTicket('pdf')}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => generarTicket('png')}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3"
                  >
                    <Image className="w-4 h-4 text-blue-500" />
                    Descargar PNG
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('financiero')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'financiero' ? 'bg-primary-600 text-white' : 'bg-card text-foreground border border-border hover:bg-muted'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Reporte Financiero
          </button>
          <button
            onClick={() => setActiveTab('clinico')}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'clinico' ? 'bg-primary-600 text-white' : 'bg-card text-foreground border border-border hover:bg-muted'
            }`}
          >
            <Activity className="w-5 h-5" />
            Reporte Clínico
          </button>
        </div>

        {/* Reporte Financiero */}
        {activeTab === 'financiero' && reporteFinanciero && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Ingresos</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      L. {reporteFinanciero.resumen.totalIngresos.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="card border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Egresos</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      L. {reporteFinanciero.resumen.totalEgresos.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </div>

              <div className={`card border-l-4 ${reporteFinanciero.resumen.utilidad >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Utilidad</p>
                    <p className={`text-3xl font-bold mt-2 ${reporteFinanciero.resumen.utilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      L. {reporteFinanciero.resumen.utilidad.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className={`w-12 h-12 opacity-20 ${reporteFinanciero.resumen.utilidad >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
              </div>

              <div className="card border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Margen de Utilidad</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {reporteFinanciero.resumen.margenUtilidad}%
                    </p>
                  </div>
                  <BarChart className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Facturas por Estado */}
              <div className="card">
                <h3 className="text-lg font-bold text-foreground mb-4">Facturas por Estado</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(reporteFinanciero.facturas.montosPorEstado)
                        .filter(([, value]) => parseFloat(value.toString()) > 0)
                        .map(([name, value]) => ({
                          name: name.charAt(0).toUpperCase() + name.slice(1),
                          value: parseFloat(value.toString())
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value, percent }) => `${name}: L. ${value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(reporteFinanciero.facturas.montosPorEstado)
                        .filter(([, value]) => parseFloat(value.toString()) > 0)
                        .map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `L. ${typeof value === 'number' ? value.toFixed(2) : value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Métodos de Pago */}
              <div className="card">
                <h3 className="text-lg font-bold text-foreground mb-4">Métodos de Pago</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(reporteFinanciero.pagos.metodosPago).map(([name, value]) => ({
                    name: name.replace(/_/g, ' '),
                    valor: parseFloat(value.toString())
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `L.${value}`} />
                    <Tooltip formatter={(value) => `L. ${typeof value === 'number' ? value.toFixed(2) : value}`} />
                    <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {Object.entries(reporteFinanciero.pagos.metodosPago).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Pacientes */}
            <div className="card">
              <h3 className="text-lg font-bold text-foreground mb-4">Top 10 Pacientes por Gasto</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Paciente</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Total Gastado</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteFinanciero.topPacientes.map((paciente, index) => {
                      const porcentaje = (paciente.total / reporteFinanciero.resumen.totalFacturas) * 100
                      return (
                        <tr key={index} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4 text-slate-900">{index + 1}. {paciente.nombre}</td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">L. {paciente.total.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{porcentaje.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen Detallado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h4 className="font-semibold text-foreground mb-4">Facturas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Facturas:</span>
                    <span className="font-semibold">{reporteFinanciero.facturas.cantidad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagadas:</span>
                    <span className="font-semibold text-green-600">{reporteFinanciero.facturas.porEstado.pagada}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendientes:</span>
                    <span className="font-semibold text-red-600">{reporteFinanciero.facturas.porEstado.pendiente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parciales:</span>
                    <span className="font-semibold text-yellow-600">{reporteFinanciero.facturas.porEstado.pagadaParcial}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold text-foreground mb-4">Flujo de Caja</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Facturas:</span>
                    <span className="font-semibold">L. {reporteFinanciero.resumen.totalFacturas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pagos:</span>
                    <span className="font-semibold text-green-600">L. {reporteFinanciero.resumen.totalPagos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo Pendiente:</span>
                    <span className="font-semibold text-red-600">L. {reporteFinanciero.resumen.saldoPendiente.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold text-foreground mb-4">Egresos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Egresos:</span>
                    <span className="font-semibold">L. {reporteFinanciero.resumen.totalEgresos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cantidad:</span>
                    <span className="font-semibold">{reporteFinanciero.egresos.cantidad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Promedio:</span>
                    <span className="font-semibold">
                      L. {(reporteFinanciero.resumen.totalEgresos / Math.max(reporteFinanciero.egresos.cantidad, 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reporte Clínico */}
        {activeTab === 'clinico' && reporteClinico && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Citas Realizadas</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{reporteClinico.resumen.citasTotal}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="card border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Pacientes Atendidos</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{reporteClinico.resumen.pacientesAtendidos}</p>
                  </div>
                  <Users className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </div>

              <div className="card border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Tasa de Asistencia</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{reporteClinico.resumen.tasaAsistencia.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </div>

              <div className="card border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Procedimientos</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{reporteClinico.resumen.procedimientosRealizados}</p>
                  </div>
                  <Activity className="w-12 h-12 text-orange-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Citas por Estado */}
              <div className="card">
                <h3 className="text-lg font-bold text-foreground mb-4">Citas por Estado</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(reporteClinico.citas.porEstado).map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    cantidad: value
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tratamientos por Estado */}
              <div className="card">
                <h3 className="text-lg font-bold text-foreground mb-4">Tratamientos por Estado</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(reporteClinico.tratamientos.porEstado)
                        .filter(([, value]) => value > 0)
                        .map(([name, value]) => ({
                          name: name.charAt(0).toUpperCase() + name.slice(1),
                          value
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(reporteClinico.tratamientos.porEstado)
                        .filter(([, value]) => value > 0)
                        .map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Procedimientos */}
            <div className="card">
              <h3 className="text-lg font-bold text-foreground mb-4">Top Procedimientos Realizados</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Procedimiento</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Cantidad</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteClinico.procedimientos.topProcedimientos.map((proc, index) => {
                      const porcentaje = (proc.cantidad / reporteClinico.resumen.procedimientosRealizados) * 100
                      return (
                        <tr key={index} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4 text-slate-900">{index + 1}. {proc.nombre}</td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">{proc.cantidad}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{porcentaje.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen Detallado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h4 className="font-semibold text-foreground mb-4">Citas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{reporteClinico.resumen.citasTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completadas:</span>
                    <span className="font-semibold text-green-600">{reporteClinico.citas.completadas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No Asistió:</span>
                    <span className="font-semibold text-red-600">{reporteClinico.citas.noAsistio}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold text-foreground mb-4">Tratamientos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creados:</span>
                    <span className="font-semibold">{reporteClinico.resumen.tratamientosCreados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo Total:</span>
                    <span className="font-semibold">L. {reporteClinico.tratamientos.costoTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo Promedio:</span>
                    <span className="font-semibold">L. {reporteClinico.tratamientos.costoPromedio}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-semibold text-foreground mb-4">Procedimientos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{reporteClinico.resumen.procedimientosRealizados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo Total:</span>
                    <span className="font-semibold">L. {reporteClinico.procedimientos.costoTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo Promedio:</span>
                    <span className="font-semibold">L. {reporteClinico.procedimientos.costoPromedio}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
