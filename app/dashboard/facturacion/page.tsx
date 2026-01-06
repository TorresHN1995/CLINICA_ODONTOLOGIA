'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Eye, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfiguracion } from '@/app/hooks/useConfiguracion'

interface Factura {
  id: string
  numero: string
  fecha: Date
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  estado: string
  paciente: {
    nombre: string
    apellido: string
    identificacion: string
  }
  items: any[]
  pagos: any[]
}

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const { data: config } = useConfiguracion()
  const moneda = config?.simboloMoneda || 'L.'

  useEffect(() => {
    fetchFacturas()
  }, [filtroEstado])

  const fetchFacturas = async () => {
    try {
      setLoading(true)
      const url = filtroEstado
        ? `/api/facturas?estado=${filtroEstado}`
        : '/api/facturas'
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setFacturas(data)
      } else {
        toast.error('Error al cargar facturas')
      }
    } catch (error) {
      toast.error('Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }

  const calcularTotalPagado = (pagos: any[]) => {
    return pagos.reduce((sum, pago) => sum + Number(pago.monto), 0)
  }

  const calcularSaldoPendiente = (factura: Factura) => {
    const totalPagado = calcularTotalPagado(factura.pagos)
    return Number(factura.total) - totalPagado
  }

  // Estadísticas
  const totalIngresos = facturas
    .filter(f => f.estado === 'PAGADA')
    .reduce((sum, f) => sum + Number(f.total), 0)

  const totalPendiente = facturas
    .filter(f => f.estado === 'PENDIENTE' || f.estado === 'PAGADA_PARCIAL')
    .reduce((sum, f) => sum + calcularSaldoPendiente(f), 0)

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturación y Pagos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las facturas y pagos de la clínica
          </p>
        </div>
        <Link
          href="/dashboard/facturacion/nueva"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Factura</span>
        </Link>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ingresos Totales</p>
              <p className="text-3xl font-bold mt-2">{moneda}{totalIngresos.toLocaleString()}</p>
              <p className="text-green-100 text-sm mt-2">
                {facturas.filter(f => f.estado === 'PAGADA').length} facturas pagadas
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pendiente de Cobro</p>
              <p className="text-3xl font-bold mt-2">{moneda}{totalPendiente.toLocaleString()}</p>
              <p className="text-orange-100 text-sm mt-2">
                {facturas.filter(f => f.estado === 'PENDIENTE' || f.estado === 'PAGADA_PARCIAL').length} facturas
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Facturas</p>
              <p className="text-3xl font-bold mt-2">{facturas.length}</p>
              <p className="text-blue-100 text-sm mt-2">
                Este mes
              </p>
            </div>
            <Calendar className="w-12 h-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="label">Filtrar por estado:</label>
          <select
            className="input-field w-64"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="PAGADA_PARCIAL">Pagadas Parcialmente</option>
            <option value="PAGADA">Pagadas</option>
            <option value="ANULADA">Anuladas</option>
          </select>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron facturas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facturas.map((factura) => {
                  const totalPagado = calcularTotalPagado(factura.pagos)
                  const saldoPendiente = calcularSaldoPendiente(factura)

                  return (
                    <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900">
                          {factura.numero}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {factura.paciente.nombre} {factura.paciente.apellido}
                          </div>
                          <div className="text-sm text-gray-500">
                            {factura.paciente.identificacion}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {format(new Date(factura.fecha), "dd/MM/yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {moneda}{Number(factura.total).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          {moneda}{totalPagado.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${saldoPendiente > 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                          {moneda}{saldoPendiente.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${factura.estado === 'PAGADA' ? 'bg-green-100 text-green-800' :
                          factura.estado === 'PAGADA_PARCIAL' ? 'bg-yellow-100 text-yellow-800' :
                            factura.estado === 'PENDIENTE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {factura.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/dashboard/facturacion/${factura.id}`}
                          className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors inline-flex items-center"
                        >
                          <Eye className="w-5 h-5 mr-1" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

