'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ShoppingCart, Search, Loader2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseFechaLocal } from '@/lib/fecha'

interface Compra {
  id: string
  proveedor: string
  numeroFactura: string | null
  fecha: string
  metodoPago: string
  total: number | string
  estado: string
  registrador: { nombre: string; apellido: string } | null
  _count: { detalles: number }
}

const estadoColor: Record<string, string> = {
  RECIBIDA: 'bg-green-100 text-green-800',
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  ANULADA: 'bg-red-100 text-red-800',
}

export default function ComprasPage() {
  const router = useRouter()
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const cargar = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      const res = await fetch(`/api/compras?${query.toString()}`)
      const data = await res.json()
      if (res.ok) setCompras(data)
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const totalPeriodo = compras.reduce((sum, c) => sum + Number(c.total), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
            <p className="text-gray-600 mt-1">Registro de adquisiciones que ingresan al inventario</p>
          </div>
        </div>
        <Link
          href="/dashboard/compras/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Compra
        </Link>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por proveedor o N° de factura..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : compras.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>No hay compras registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N° Factura</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Productos</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {compras.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/compras/${c.id}`)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(parseFechaLocal(c.fecha), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.proveedor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.numeroFactura || '—'}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-600">{c._count.detalles}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      L. {Number(c.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${estadoColor[c.estado] || 'bg-gray-100 text-gray-800'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Eye className="w-5 h-5 text-blue-600 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Total del listado:</td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">L. {totalPeriodo.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
