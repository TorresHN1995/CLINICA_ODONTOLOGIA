'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Loader2, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseFechaLocal } from '@/lib/fecha'

interface Detalle {
  id: string
  cantidad: number
  costoUnitario: number | string
  subtotal: number | string
  inventario: { id: string; codigo: string; nombre: string; unidadMedida: string }
}

interface Compra {
  id: string
  proveedor: string
  numeroFactura: string | null
  fecha: string
  metodoPago: string
  total: number | string
  estado: string
  observaciones: string | null
  registrador: { nombre: string; apellido: string } | null
  egreso: { id: string; categoria: string; estado: string } | null
  detalles: Detalle[]
}

export default function DetalleCompraPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [compra, setCompra] = useState<Compra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/compras/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setCompra)
      .catch(() => router.push('/dashboard/compras'))
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  if (!compra) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compras" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compra a {compra.proveedor}</h1>
            <p className="text-gray-600">
              {format(parseFechaLocal(compra.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
              {compra.numeroFactura && ` · Factura ${compra.numeroFactura}`}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 text-sm">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">L. {Number(compra.total).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 text-sm">Método de pago</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">{compra.metodoPago.replace('_', ' ')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 text-sm">Egreso generado</p>
          {compra.egreso ? (
            <p className="text-lg font-semibold text-green-700 mt-2 flex items-center gap-1">
              <DollarSign className="w-5 h-5" /> {compra.egreso.categoria.replace(/_/g, ' ')} · {compra.egreso.estado}
            </p>
          ) : (
            <p className="text-lg font-semibold text-gray-400 mt-2">—</p>
          )}
        </div>
      </div>

      {/* Detalles */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Productos ingresados al inventario</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Costo U.</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {compra.detalles.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.inventario.codigo}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.inventario.nombre}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{d.cantidad} {d.inventario.unidadMedida}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">L. {Number(d.costoUnitario).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">L. {Number(d.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Total:</td>
                <td className="px-4 py-3 text-lg font-bold text-gray-900 text-right">L. {Number(compra.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {compra.observaciones && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Observaciones</p>
            <p className="text-sm text-gray-600">{compra.observaciones}</p>
          </div>
        )}
        {compra.registrador && (
          <p className="mt-4 text-sm text-gray-500">
            Registrado por {compra.registrador.nombre} {compra.registrador.apellido}
          </p>
        )}
      </div>
    </div>
  )
}
