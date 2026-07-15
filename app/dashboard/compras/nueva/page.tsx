'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { hoyLocalISO } from '@/lib/fecha'

interface Producto {
  id: string
  codigo: string
  nombre: string
  unidadMedida: string
}

interface Linea {
  // Producto existente
  inventarioId?: string
  // Producto nuevo
  codigo?: string
  categoria?: string
  unidadMedida?: string
  // Comunes
  nombre: string
  cantidad: number
  costoUnitario: number
  esNuevo: boolean
  // Solo producto nuevo: si se define, se crea también en el catálogo facturable
  precioVenta?: number
  isv?: number
}

const CATEGORIAS_INVENTARIO = [
  { value: 'MATERIAL_DENTAL', label: 'Material Dental' },
  { value: 'INSTRUMENTAL', label: 'Instrumental' },
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'CONSUMIBLE', label: 'Consumible' },
  { value: 'EQUIPAMIENTO', label: 'Equipamiento' },
  { value: 'OTRO', label: 'Otro' },
]

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTRO', label: 'Otro' },
]

export default function NuevaCompraPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [lineas, setLineas] = useState<Linea[]>([])

  const [formData, setFormData] = useState({
    proveedor: '',
    numeroFactura: '',
    fecha: hoyLocalISO(),
    metodoPago: 'EFECTIVO',
    observaciones: '',
  })

  // Sub-formulario de línea
  const [modoNuevo, setModoNuevo] = useState(false)
  const [linea, setLinea] = useState({
    inventarioId: '',
    codigo: '',
    nombre: '',
    categoria: 'MATERIAL_DENTAL',
    unidadMedida: 'UNIDAD',
    cantidad: '',
    costoUnitario: '',
    precioVenta: '',
    isv: '15',
  })
  // Búsqueda dinámica de producto existente
  const [busquedaProd, setBusquedaProd] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

  const productosFiltrados = (
    busquedaProd.trim()
      ? productos.filter((p) => `${p.codigo} ${p.nombre}`.toLowerCase().includes(busquedaProd.toLowerCase()))
      : productos
  ).slice(0, 8)

  useEffect(() => {
    fetch('/api/inventario?limit=1000')
      .then((r) => r.json())
      .then((data) => setProductos(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const resetLinea = () => {
    setLinea({ inventarioId: '', codigo: '', nombre: '', categoria: 'MATERIAL_DENTAL', unidadMedida: 'UNIDAD', cantidad: '', costoUnitario: '', precioVenta: '', isv: '15' })
    setBusquedaProd('')
    setMostrarSugerencias(false)
  }

  const handleAgregarLinea = () => {
    const cantidad = parseFloat(linea.cantidad)
    const costoUnitario = parseFloat(linea.costoUnitario)
    if (!cantidad || cantidad <= 0 || isNaN(costoUnitario) || costoUnitario < 0) {
      toast.error('Ingresa cantidad y costo válidos')
      return
    }

    if (modoNuevo) {
      if (!linea.codigo || !linea.nombre || !linea.categoria || !linea.unidadMedida) {
        toast.error('Completa código, nombre, categoría y unidad del producto nuevo')
        return
      }
      const precioVenta = linea.precioVenta.trim() !== '' ? parseFloat(linea.precioVenta) : undefined
      if (precioVenta !== undefined && (isNaN(precioVenta) || precioVenta < 0)) {
        toast.error('Precio de venta inválido')
        return
      }
      const isv = linea.isv.trim() !== '' ? parseFloat(linea.isv) : undefined
      setLineas([
        ...lineas,
        {
          esNuevo: true,
          codigo: linea.codigo,
          nombre: linea.nombre,
          categoria: linea.categoria,
          unidadMedida: linea.unidadMedida,
          cantidad,
          costoUnitario,
          precioVenta,
          isv: precioVenta !== undefined ? (isv ?? 15) : undefined,
        },
      ])
    } else {
      const prod = productos.find((p) => p.id === linea.inventarioId)
      if (!prod) {
        toast.error('Selecciona un producto')
        return
      }
      setLineas([
        ...lineas,
        {
          esNuevo: false,
          inventarioId: prod.id,
          nombre: `${prod.codigo} — ${prod.nombre}`,
          unidadMedida: prod.unidadMedida,
          cantidad,
          costoUnitario,
        },
      ])
    }
    resetLinea()
    toast.success('Producto agregado')
  }

  const handleEliminarLinea = (index: number) => {
    setLineas(lineas.filter((_, i) => i !== index))
  }

  const total = lineas.reduce((sum, l) => sum + l.cantidad * l.costoUnitario, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.proveedor) {
      toast.error('Ingresa el proveedor')
      return
    }
    if (lineas.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    try {
      setLoading(true)
      const items = lineas.map((l) =>
        l.esNuevo
          ? {
              codigo: l.codigo,
              nombre: l.nombre,
              categoria: l.categoria,
              unidadMedida: l.unidadMedida,
              cantidad: l.cantidad,
              costoUnitario: l.costoUnitario,
              ...(l.precioVenta != null && { precioVenta: l.precioVenta, isv: l.isv ?? 15 }),
            }
          : {
              inventarioId: l.inventarioId,
              cantidad: l.cantidad,
              costoUnitario: l.costoUnitario,
            }
      )

      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor: formData.proveedor,
          numeroFactura: formData.numeroFactura || undefined,
          fecha: formData.fecha,
          metodoPago: formData.metodoPago,
          observaciones: formData.observaciones || undefined,
          items,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al registrar compra')
      }
      const compra = await res.json()
      toast.success('Compra registrada y agregada al inventario')
      router.push(`/dashboard/compras/${compra.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compras" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Compra</h1>
          <p className="text-gray-600 mt-1">Registra una compra; los productos ingresan al inventario y se genera un egreso</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la compra */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Datos de la Compra</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                placeholder="Nombre del proveedor"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">N° de Factura</label>
              <input
                type="text"
                value={formData.numeroFactura}
                onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                placeholder="Opcional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={2}
                placeholder="Notas adicionales..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Productos</h2>

          {/* Sub-form agregar */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="radio" checked={!modoNuevo} onChange={() => setModoNuevo(false)} />
                Producto existente
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="radio" checked={modoNuevo} onChange={() => setModoNuevo(true)} />
                Producto nuevo
              </label>
            </div>

            {!modoNuevo ? (
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Producto de inventario</label>
                <input
                  type="text"
                  value={busquedaProd}
                  onChange={(e) => {
                    setBusquedaProd(e.target.value)
                    setLinea({ ...linea, inventarioId: '' })
                    setMostrarSugerencias(true)
                  }}
                  onFocus={() => setMostrarSugerencias(true)}
                  onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                  placeholder="Escribe código o nombre para buscar…"
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {mostrarSugerencias && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {productos.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No hay productos en inventario</div>
                    ) : productosFiltrados.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">Sin resultados para “{busquedaProd}”</div>
                    ) : (
                      productosFiltrados.map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setLinea({ ...linea, inventarioId: p.id })
                            setBusquedaProd(`${p.codigo} — ${p.nombre}`)
                            setMostrarSugerencias(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium text-gray-900">{p.codigo}</span>
                          <span className="text-gray-600"> — {p.nombre}</span>
                          <span className="text-xs text-gray-400"> ({p.unidadMedida})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {linea.inventarioId && (
                  <p className="mt-1 text-xs text-green-600">✓ Producto seleccionado</p>
                )}
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
                  <input
                    type="text"
                    value={linea.codigo}
                    onChange={(e) => setLinea({ ...linea, codigo: e.target.value })}
                    placeholder="Ej: MD-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={linea.nombre}
                    onChange={(e) => setLinea({ ...linea, nombre: e.target.value })}
                    placeholder="Nombre del producto"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={linea.categoria}
                    onChange={(e) => setLinea({ ...linea, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIAS_INVENTARIO.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
                  <input
                    type="text"
                    value={linea.unidadMedida}
                    onChange={(e) => setLinea({ ...linea, unidadMedida: e.target.value })}
                    placeholder="UNIDAD, CAJA…"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio de venta (L.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={linea.precioVenta}
                    onChange={(e) => setLinea({ ...linea, precioVenta: e.target.value })}
                    placeholder="Opcional — para venderlo/facturarlo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISV (%)</label>
                  <select
                    value={linea.isv}
                    onChange={(e) => setLinea({ ...linea, isv: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="15">15% (gravado)</option>
                    <option value="18">18% (gravado)</option>
                    <option value="0">0% (exento)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Si indicás un precio de venta, el producto se agrega también al catálogo de <strong>Productos/Servicios</strong> y queda facturable en todo el sistema. Si lo dejás vacío, solo ingresa al inventario.
              </p>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={linea.cantidad}
                  onChange={(e) => setLinea({ ...linea, cantidad: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Costo unitario (L.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={linea.costoUnitario}
                  onChange={(e) => setLinea({ ...linea, costoUnitario: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAgregarLinea}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Agregar
              </button>
            </div>
          </div>

          {/* Lista de líneas */}
          {lineas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No hay productos agregados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Cant.</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Costo U.</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lineas.map((l, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {l.nombre}
                        {l.esNuevo && <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">nuevo</span>}
                        {l.esNuevo && l.precioVenta != null && <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">facturable</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{l.cantidad} {l.unidadMedida}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">L. {l.costoUnitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">L. {(l.cantidad * l.costoUnitario).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleEliminarLinea(i)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Total:</td>
                    <td className="px-4 py-3 text-lg font-bold text-blue-600 text-right">L. {total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Registrando…' : 'Registrar Compra'}
          </button>
          <Link
            href="/dashboard/compras"
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
